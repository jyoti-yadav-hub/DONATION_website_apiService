import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { ErrorlogServiceForCron } from './controller/error-log/error-log.service';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import AdmZip from 'adm-zip';
import moment from 'moment';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { CommonService } from './common/common.service';

const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});

@Injectable()
export class BackupService {
  constructor(
    private readonly errorlogService: ErrorlogServiceForCron,
    private readonly commonService: CommonService,
  ) {}

  async performBackup() {
    try {
      await this.deleteZipFile();

      // Connect to MongoDB
      const client = new MongoClient(process.env.MONGOURL);
      await client.connect();

      const db = client.db(process.env.DB_NAME);

      // Create a backup directory
      const backupDir = './backup';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      // Create a backup file name based on the current date
      const backupFileName = `mongodb_backup_${parseInt(
        moment().format('X'),
      )}.zip`;

      const backupFilePath = `${backupDir}/${backupFileName}`;

      // Create a new instance of AdmZip
      const zip = new AdmZip();

      // Backup the MongoDB database and add the files to the zip
      const files = await db.listCollections().toArray();

      let count = 0;
      const getZip = async (file) => {
        if (count >= files.length) {
          // Save the zip file
          await zip.writeZip(backupFilePath);
          // Upload the backup file to azure
          await this.commonService.imageUploadService(
            backupFileName,
            'backup_db',
            '',
            './backup',
          );

          // Close the MongoDB connection
          client.close();
        }

        // Iterate through collections in the database
        const collectionName = file?.name;

        if (collectionName && collectionName != 'api-logs') {
          // Retrieve all documents from the current collection
          const collectionData = await db
            .collection(collectionName)
            .find({})
            .toArray();
          // Convert the collection data to JSON format with 2-space indentation
          const collectionJSON = JSON.stringify(collectionData, null, 2);
          // Add the JSON data as a file to the zip archive
          zip.addFile(
            `${collectionName}.json`,
            Buffer.alloc(collectionJSON.length, collectionJSON),
          );
        }

        count += 1;
        getZip(files[count]);
      };

      getZip(files[count]);
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/backup.service.ts-performBackup',
      );
      return error;
    }
  }

  // Call the function to delete the zip file
  async deleteZipFile() {
    try {
      // Calculate the date one week ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const accountName = process.env.ACCOUNT_NAME;
      const accountKey = process.env.ACCOUNT_KEY;
      const containerName = process.env.CONTAINER_NAME;

      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential,
      );

      const blobContainerClient =
        blobServiceClient.getContainerClient(containerName);

      let iterator = blobContainerClient.listBlobsFlat({
        prefix: 'backup_db/',
      });

      // Prints blob names
      for await (const blob of iterator) {
        const fileCreationDate = blob.properties.createdOn;
        const blobName = blob.name;

        //check blob create before 7 days or not
        if (fileCreationDate <= oneWeekAgo) {
          //delete blobs
          const blockBlobClient = await blobContainerClient.getBlockBlobClient(
            blobName,
          );
          await blockBlobClient.delete();
        }
      }
    } catch (error) {
      // Handle and log any errors
      this.errorlogService.errorLog(
        error,
        'src/backup.service.ts-deleteZipFile',
      );
      return error;
    }
  }

  //Cron function to backup database at midnight
  @Cron(' 0 0 * * *')
  async midnightCronJob() {
    await this.performBackup();
  }
}
