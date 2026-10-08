import { z } from 'zod';
import { calculateAge } from '../utils/dateFormatter';

export const voterRegistrationSchema = z
  .object({
    name: z.string().trim().min(1, 'Full Name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Must be a valid email address'),
    dob: z
      .string()
      .min(1, 'Date of Birth is required')
      .refine((val) => {
        const parts = val.split('-');
        if (parts.length !== 3) return false;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return !isNaN(d.getTime()) && d <= new Date();
      }, 'Please enter a valid Date of Birth')
      .refine((val) => calculateAge(val) >= 18, 'Eligible age for voter is 18 years or above'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type VoterRegistrationFormData = z.infer<typeof voterRegistrationSchema>;

export const electionCreationSchema = z
  .object({
    name: z.string().trim().min(1, 'Election name is required'),
    description: z.string().optional(),
    registrationStartDate: z.string().min(1, 'Registration start date is required'),
    registrationStartTime: z.string().min(1, 'Registration start time is required'),
    registrationEndDate: z.string().min(1, 'Registration end date is required'),
    registrationEndTime: z.string().min(1, 'Registration end time is required'),
    votingStartDate: z.string().min(1, 'Voting start date is required'),
    votingStartTime: z.string().min(1, 'Voting start time is required'),
    votingEndDate: z.string().min(1, 'Voting end date is required'),
    votingEndTime: z.string().min(1, 'Voting end time is required'),
  })
  .superRefine((data, ctx) => {
    const regStart = new Date(`${data.registrationStartDate}T${data.registrationStartTime}`);
    const regEnd = new Date(`${data.registrationEndDate}T${data.registrationEndTime}`);
    const voteStart = new Date(`${data.votingStartDate}T${data.votingStartTime}`);
    const voteEnd = new Date(`${data.votingEndDate}T${data.votingEndTime}`);

    if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime()) || isNaN(voteStart.getTime()) || isNaN(voteEnd.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date or time values',
        path: ['name'],
      });
      return;
    }

    if (regStart >= regEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Registration start must be before registration end',
        path: ['registrationEndDate'],
      });
    }

    if (regEnd >= voteStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Registration must finish before voting starts',
        path: ['votingStartDate'],
      });
    }

    if (voteStart >= voteEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Voting start must be before voting end',
        path: ['votingEndDate'],
      });
    }
  });

export type ElectionCreationFormData = z.infer<typeof electionCreationSchema>;
