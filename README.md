# <YOUR_APP_NAME>

Built with [Wasp](https://wasp.sh), based on the [Open Saas](https://opensaas.sh) template.

## Development

### Running locally
 - Make sure you have the `.env.client` and `.env.server` files with correct dev values in the root of the project.
 - Run the database with `wasp start db` and leave it running.
 - Run `wasp start` and leave it running.
 - [OPTIONAL]: If this is the first time starting the app, or you've just made changes to your entities/prisma schema, also run `wasp db migrate-dev`.

## Menu Item Image Upload Implementation

We've implemented a feature to allow restaurant owners to upload images for menu items. Here's what was added:

### Database Changes
- Added an `imageUrl` field to the `MenuItem` model in `schema.prisma`

### Backend Implementation
- Created `menuItemImageUtils.ts` with utilities for S3 image uploads
- Added a new operation `getMenuItemImageUploadUrl` to generate pre-signed URLs for S3 uploads
- Updated the `updateMenuItem` operation to handle the `imageUrl` field

### Frontend Implementation
- Created a `MenuItemImageUpload` component for handling image uploads
- Updated the `MenuEditorPage` to include the image upload component
- Updated the `PublicMenuPage` to display menu item images

### How It Works
1. When editing a menu item, users can upload an image using the image upload component
2. The image is uploaded directly to AWS S3 using pre-signed URLs
3. After successful upload, the menu item is updated with the image URL
4. The image appears as a thumbnail in the edit view and as a full image in the public menu

### Required Dependencies
- AWS S3 bucket configured with proper CORS settings
- AWS IAM credentials with S3 access
- Environment variables in `.env.server`:
  - `AWS_S3_IAM_ACCESS_KEY`
  - `AWS_S3_IAM_SECRET_KEY`
  - `AWS_S3_FILES_BUCKET`
  - `AWS_S3_REGION`

### Next Steps
To complete the implementation:
1. Run database migrations to apply the schema changes
2. Install required dependencies: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @types/node`
3. Configure CORS on your S3 bucket to allow uploads from your domain
4. Test the image upload functionality

### Design Decisions
- Images are stored in S3 rather than the database for better performance and scalability
- Pre-signed URLs are used for secure direct uploads
- Images are organized in S3 by user, menu, and item IDs for better organization
- Thumbnails are generated on-the-fly using CSS rather than storing separate thumbnail images

