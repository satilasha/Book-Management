
const bookModel = require('../models/bookModel')
const reviewModel = require("../models/reviewModel")
const validate = require('../validator/validators')

const addReview = async (req, res) => {
    try {
        let book_id = req.params.bookId
        if (!validate.isValidObjectId(book_id)) {
            return res.status(400).send({ status: false, message: "Please enter a valid Book Id" })
        }
        if (!validate.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Please enter review data for review" })
        }
        let { bookId, reviewedBy, rating, review } = req.body
        if (!validate.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Book Id required" })
        }
        if (!validate.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Invalid Book Id" })
        }
        let validBook = await bookModel.findOne({ _id: book_id, isDeleted: false })
        if (!validBook) {
            return res.status(404).send({ status: false, message: "Book not found" })
        }
        if (req.body.bookId != book_id) {
            return res.status(400).send({ status: false, message: "Book Id mismatch" })
        }
        if (!Object.keys(req.body).includes("reviewedBy")) {
            return res.status(404).send({ status: false, message: "reviewedBy is require" })
        }
        if (Object.keys(req.body).includes("reviewedBy")) {
            if (typeof reviewedBy != 'string') {
                return res.status(400).send({ status: false, message: "Please Give a proper Name" })
            }
            if ((reviewedBy.trim() == "") || (reviewedBy == null)) {
                reviewedBy = 'Guest'
            }
        }
        if (!rating) {
            return res.status(400).send({ status: false, message: "Rating is required" })
        }
        if (!(rating >= 1 && rating <= 5)) {
            return res.status(400).send({ status: false, message: "Invalid Rating! please rate in between 1 to 5" })
        }
        if (!validate.isValid(review)) {
            return res.status(400).send({ status: false, message: "Please Enter A Valid Review" })
        }
        let reviewedAt = new Date();

        if (req.body.isDeleted == true) {
            return res.status(400).send({ status: false, message: "No data should be deleted At the time of Creation" })
        }
        const finalData = { bookId, reviewedBy, reviewedAt, rating, review }
        let newReview = await reviewModel.create(finalData)
        let addedReview = newReview.toObject()
        delete addedReview.createdAt
        delete addedReview.updatedAt
        delete addedReview.__v

        let updatedBook = await bookModel.findOneAndUpdate({ _id: book_id, isDeleted: false }, { $inc: { reviews: 1 } }, { new: true })

        return res.status(201).send({
            status: true, message: "Success", data: { ...updatedBook.toObject(), reviewsData: [addedReview] }
        })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}


const updateReview = async (req, res) => {

    try {
        const review_id = req.params.reviewId
        const book_id = req.params.bookId
        let updateData = {}

        if (!validate.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Please provide data to update" })
        }
        if (!validate.isValidObjectId(book_id)) {
            return res.status(400).send({ status: false, message: "Invalid Book Id" })
        }
        let validBook = await bookModel.findOne({ _id: book_id, isDeleted: false })
        if (!validBook) {
            return res.status(404).send({ status: false, message: "Book not found" })
        }
        if (!validate.isValidObjectId(review_id)) {
            return res.status(400).send({ status: false, message: "Invalid ReviewId" })
        }
        let validReview = await reviewModel.findOne({ _id: review_id, isDeleted: false })
        if (!validReview) {
            return res.status(404).send({ status: false, message: "Review not found" })
        }

        if (validReview.bookId != book_id) {
            return res.status(400).send({ status: false, message: "BookId mismatch" })
        }

        let reviewKeys = ["reviewedBy", "rating", "review"]
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            let keyPresent = reviewKeys.includes(Object.keys(req.body)[i])
            if (!keyPresent)
                return res.status(400).send({ status: false, msg: "Wrong Key present" })
        }
        let { reviewedBy, rating, review } = req.body
        if (Object.keys(req.body).includes("reviewedBy")) {
            if (typeof reviewedBy != 'string') {
                return res.status(400).send({ status: false, message: "Please Give a proper Name" })
            }
            if ((reviewedBy.trim() == "") || (reviewedBy == null)) {
                reviewedBy = 'Guest'
            }
            updateData.reviewedBy = reviewedBy
        }

        if (Object.keys(req.body).includes("rating")) {
            if (!(rating >= 1 && rating <= 5)) {
                return res.status(400).send({ status: false, message: "Invalid Rating! , please rate in beetween 1 to 5" })
            }
            updateData.rating = rating
        }

        if (Object.keys(req.body).includes("review")) {
            if (!validate.isValid(review)) {
                return res.status(400).send({ status: false, message: "Please Enter A Valid Review" })
            }
            updateData.review = review
        }

        const updatedReview = await reviewModel.findOneAndUpdate({ _id: review_id, isDeleted: false },
            { $set: updateData },
            { new: true })

        let finalReview = updatedReview.toObject()
        delete finalReview.createdAt
        delete finalReview.updatedAt
        delete finalReview.__v
        return res.status(200).send({ status: true, message: "Success", Data: { ...validBook.toObject(), reviewsData: [finalReview] } })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const deleteReview = async (req, res) => {
    try {
        if (!validate.isValidObjectId(req.params.bookId)) {
            return res.status(400).send({ status: false, message: "BookId is not valid" })
        }
        if (!validate.isValidObjectId(req.params.reviewId)) {
            return res.status(400).send({ status: false, message: "ReviewId is not valid" })
        }
        let book = await bookModel.findOne({ _id: req.params.bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: 'Book not found ' })
        }
        const deleteReview = await reviewModel.findOneAndUpdate(
            { _id: req.params.reviewId, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true });
        if (deleteReview) {
            if (deleteReview.bookId != req.params.bookId) {
                return res.status(400).send({ status: false, message: "This review dosent belong to the given Book Id" })
            }
            await bookModel.findByIdAndUpdate({ _id: req.params.bookId }, { $inc: { reviews: -1 } })
            return res.status(200).send({ status: true, message: "Review is deleted successfully" })
        }
        return res.status(404).send({ status: false, message: 'Review not found' })

    } catch (error) {
        res.status(500).send({ satus: false, error: error.message })
    }

}


module.exports.addReview = addReview
module.exports.deleteReview = deleteReview
module.exports.updateReview = updateReview
