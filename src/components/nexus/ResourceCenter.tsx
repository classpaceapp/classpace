import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResourceCenterFull from './ResourceCenterFull';

const ResourceCenter: React.FC = () => {
  const { subscription } = useAuth();
  const isPremium = subscription?.subscribed && subscription.tier === 'teacher_premium';

  if (isPremium) {
    return <ResourceCenterFull />;
  }

  return null; // Upgrade overlay shown by parent
};

export default ResourceCenter;