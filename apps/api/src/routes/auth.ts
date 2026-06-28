import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseAnon } from '../db/client';
import { authRateLimit } from '../middleware/rateLimit';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

router.post(
  '/register',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const supabaseAnon = getSupabaseAnon();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', body.username)
      .maybeSingle();

    if (existingUser) {
      throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
    }

    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (authError || !authData.user) {
      throw new AppError(400, authError?.message ?? 'Registration failed', 'REGISTER_FAILED');
    }

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: body.email,
      username: body.username,
    });

    if (profileError) {
      throw new AppError(500, 'Failed to create user profile', 'PROFILE_CREATE_FAILED');
    }

    res.status(201).json({
      data: {
        user: {
          id: authData.user.id,
          email: body.email,
          username: body.username,
        },
        session: authData.session
          ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_in: authData.session.expires_in,
            }
          : null,
      },
      message: 'Account created successfully',
    });
  })
);

router.post(
  '/login',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const supabaseAnon = getSupabaseAnon();

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.session) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    res.json({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: data.user,
      },
    });
  })
);

router.post(
  '/refresh',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const body = refreshSchema.parse(req.body);
    const supabaseAnon = getSupabaseAnon();

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: body.refresh_token,
    });

    if (error || !data.session) {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    res.json({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  })
);

export default router;
