import { Router } from 'express'
const router = Router()
import { login, logout, signup } from '../controllers/auth.controller.js'

router.post('/signup', signup)

router.post('/login', login)

router.post('/logout', logout)

export default router