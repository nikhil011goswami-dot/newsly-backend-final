import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cloudFrontDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get<string>('aws.region', 'ap-south-1'),
      credentials: {
        accessKeyId:     this.configService.get<string>('aws.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey', ''),
      },
    });
    this.bucket          = this.configService.get<string>('aws.s3BucketName', '');
    this.cloudFrontDomain = this.configService.get<string>('aws.cloudFrontDomain', '');
  }

  async upload(
    file: Buffer,
    folder: string,
    mimeType: string,
    originalName: string,
  ): Promise<{ key: string; url: string }> {
    const ext = originalName.split('.').pop();
    const key = `${folder}${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket:       this.bucket,
        Key:          key,
        Body:         file,
        ContentType:  mimeType,
        CacheControl: 'max-age=31536000',
      }),
    );

    const url = this.getPublicUrl(key);
    this.logger.log(`File uploaded: ${key}`);
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`File deleted: ${key}`);
  }

  async getSignedUploadUrl(key: string, mimeType: string, expiresInSeconds = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string): string {
    if (this.cloudFrontDomain) return `${this.cloudFrontDomain}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
