import type { Request, Response } from "express";
import { adminUserLoginSchema, createAdminUserSchema } from "../config/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/db";

export async function Signup(req: Request, res: Response) {
    try {
        // Implementation for signup
        // TODO: Add actual signup logic here
        const {name, email, password} = createAdminUserSchema.parse(req.body);
        // Check if User already exists
        const checkUser = await prisma.adminUser.findUnique({
            where: {
                email: email
            }
        });
        if (checkUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // TODO: Create the user here
        const createUser = await prisma.adminUser.create({
            data: {
                name, 
                email,
                passwordHash: hashedPassword
            }, 
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: false,
            }
        })
        res.status(201).json({ message: 'Signup successful', createUser });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.error('Signup error:', error);
    }
}

export async function Login(req: Request, res: Response) {
    try {
        // Implementation for login
        // TODO: Add actual login logic here
        const {email, password} = adminUserLoginSchema.parse(req.body);
        
        // Find user by email
        const user = await prisma.adminUser.findUnique({
            where: { email }
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.error('Login error:', error);
    }
}

