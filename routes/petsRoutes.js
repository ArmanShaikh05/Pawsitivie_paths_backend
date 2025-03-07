import express from "express"
import { editPetDetails, getAllPets, getPetDetails, getPetReviewDetails, getPetsByQuery, getShopDetailsByPetId, getShopPetsDetails, postPetReview, removePet } from "../controllers/petsController.js"
import { uploadMiddleware } from "../middlewares/multer.js"

const router = new express.Router()


router.get("/pet-data/:id",getPetDetails)

router.get("/all-pets",getAllPets)

router.get("/get-shop-pets/:shopId",getShopPetsDetails)

router.get("/pets-by-query",getPetsByQuery)

router.put("/edit-pet-data",uploadMiddleware.array("files",10),editPetDetails)

router.post("/post-review",postPetReview)

router.get("/review-details",getPetReviewDetails)

router.get("/get-shop-data-by-petId",getShopDetailsByPetId)

router.delete("/remove-pet",removePet)


export default router