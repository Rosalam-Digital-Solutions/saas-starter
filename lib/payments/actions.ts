'use server';

import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createCheckoutSession, createCustomerPortalSession } from './gebar';
import { getTenantContext, requireAuth, isAdmin } from '@/lib/tenant';

export const checkoutAction = async (formData: FormData) => {
  const planKey = formData.get('planKey') as string;
  const request = formData.get('request') as unknown as NextRequest;
  
  const ctx = await getTenantContext(request);
  
  if (!ctx) {
    redirect(`/sign-up?redirect=checkout&planKey=${planKey}`);
  }
  
  await createCheckoutSession({
    request,
    organization: ctx.organization,
    planKey
  });
};

export const customerPortalAction = async (formData: FormData) => {
  const request = formData.get('request') as unknown as NextRequest;
  
  const ctx = await getTenantContext(request);
  
  if (!ctx) {
    redirect('/sign-in');
  }
  
  if (!ctx.subscription?.billingCustomerId) {
    redirect('/pricing');
  }
  
  const portalSession = await createCustomerPortalSession({
    request,
    organization: ctx.organization
  });
  
  redirect(portalSession.url);
};

export const upgradePlanAction = async (formData: FormData) => {
  const planKey = formData.get('planKey') as string;
  const request = formData.get('request') as unknown as NextRequest;
  
  const ctx = await getTenantContext(request);
  
  if (!ctx) {
    redirect('/sign-in');
  }
  
  if (!isAdmin(ctx)) {
    throw new Error('Only admins can upgrade plans');
  }
  
  await createCheckoutSession({
    request,
    organization: ctx.organization,
    planKey
  });
};