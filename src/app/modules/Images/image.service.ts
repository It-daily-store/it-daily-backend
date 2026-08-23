import { startSession } from "mongoose";
import cloudinary from "../../lib/image/image.config";
import { DeleteApiResponse, UploadApiResponse } from "cloudinary";
import { TImage } from "./image.interface";
import { Image } from "./image.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { TPagination } from "../product/product.interface";

const uploadImageIntoDB = async (
  files: Express.Multer.File[],
  type: string,
  folder: string | null
) => {
  const session = await startSession();

  if (!files) {
    throw new AppError(httpStatus.CONFLICT, "Failed to upload");
  }

  if (files?.length === 0) {
    throw new AppError(httpStatus.CONFLICT, "Upload some files");
  } else {
    files.forEach((file) => {
      if (file.size > 10485760) {
        throw new AppError(
          httpStatus.CONFLICT,
          "File size is too large. highest limit is 10 mb"
        );
      }
    });
  }

  try {
    session.startTransaction();

    const uploadImages = files.map((file) => {
      return cloudinary.uploader.upload(file.path);
    });

    const uploadedImages: UploadApiResponse[] = await Promise.all(
      uploadImages
    ).catch(() => {
      throw new AppError(httpStatus.CONFLICT, "upload failed");
    });

    if (uploadImages.length === 0) {
      throw new AppError(httpStatus.CONFLICT, "Failed to upload to cloudinary");
    }

    const payloadImages: TImage[] = uploadedImages.map(
      (image: UploadApiResponse) => ({
        extension: image.format,
        height: image.height,
        width: image.width,
        image: image.url,
        name: image.original_filename || "backup",
        size: image.bytes,
        image_type: type,
        public_id: image.public_id,
        folder: folder,
      })
    );

    const databaseResult = await Image.create(payloadImages);

    if (!databaseResult) {
      throw new AppError(httpStatus.CONFLICT, "databae upload failed");
    }

    await session.commitTransaction();
    await session.endSession();
    return databaseResult;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.CONFLICT,
      err instanceof AppError ? err?.message : "upload failed"
    );
  }
};

const getAllImagesFromDB = async (
  parent_id: string | null,
  search: string | null,
  page: number,
  limit: number
) => {
  const folder = parent_id || null;

  const query: Record<string, unknown> = { folder };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const pagination: TPagination = {
    currentPage: page,
    limit,
    total: 0,
  };

  const [result, total] = await Promise.all([
    Image.find(query)
      .sort({ createdAt: -1 })
      .skip((pagination.currentPage - 1) * pagination.limit)
      .limit(pagination.limit),
    Image.countDocuments(query),
  ]);

  pagination.total = total;
  pagination.totalPage = Math.ceil(total / pagination.limit);
  pagination.hasMore = pagination.currentPage * pagination.limit < total;

  return { result, pagination };
};

const deleteImagesFromDB = async ({
  public_ids,
  database_ids,
}: {
  public_ids: string[];
  database_ids: string[];
}) => {
  const session = await startSession();

  try {
    session.startTransaction();
    const deletedFromCloud: DeleteApiResponse =
      await cloudinary.api.delete_resources([...public_ids], {
        type: "upload",
        resource_type: "image",
      });

    if (!deletedFromCloud) {
      throw new AppError(httpStatus.CONFLICT, "Failed to delete from cloud");
    }

    const deleteFromBD = await Image.deleteMany({
      _id: { $in: [...database_ids] },
    });

    if (!deleteFromBD) {
      throw new AppError(httpStatus.CONFLICT, "Failed to delete from database");
    }

    await session.commitTransaction();
    await session.endSession();

    return deleteFromBD;
  } catch {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.CONFLICT, "Delete failed");
  }
};

export const ImageUploadServices = {
  uploadImageIntoDB,
  getAllImagesFromDB,
  deleteImagesFromDB,
};
