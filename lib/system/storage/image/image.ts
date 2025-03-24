export type UploadedImageProps = {
  user_id: string;
  blog_id: string;
  image_url: string;
  file_size: number;
  uploaded_at: number;
};

export class UploadedImage {
  id!: string;
  user_id!: string;
  blog_id!: string;
  image_url!: string;
  file_size: number = 0;
  uploaded_at!: number;

  constructor(data: UploadedImageProps) {
    Object.assign(this, data);
  }
}
