const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    // Fetch all notes
    const notes = await Note.find().lean()

    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }

    // Iterate through all notes and add username to output
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Diplicate note title' })
    }

    // Create and store the new note
    const note = await Note.create({ user, title, text })

    if (note) {
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Confirm note exists
    const note = await Note.findById(id).exec()
    
    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check if for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming note to its own name
    if (duplicate && duplicate?._id.toString() != id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    // Update
    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json(`${updatedNote.title} updated`)
})

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        res.status(400).json({ message: 'Note ID required' })
    }

    // Confirm note exists
    const note = await Note.findById(id).exec()

    if (!note) {
        res.status(400).json({ message: 'Note not found' })
    }

    // Delete
    await note.deleteOne()

    const reply = `Note ${note.title} with ID ${note._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}