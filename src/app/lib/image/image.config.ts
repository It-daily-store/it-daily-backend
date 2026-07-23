import { v2 as cloudinary } from 'cloudinary';
import config from '../../config';

cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.cloud_api,
    api_secret: config.cloud_secret
});

export default cloudinary