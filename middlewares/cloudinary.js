import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const UploadProfilePic = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/ProfilePic/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadOwnedPetPic = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/OwnedPet/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadShopImages = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/Shops/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadShopPetImages = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/PetShops/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadShopProductImages = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/ShopProducts/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadPostsImages = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/Posts/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};

export const UploadMessageMedia = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // uploading file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `Pawsitive_Paths/Messages/${folderName}`,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log(error);
    return null;
  }
};
