import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  MainTabs: undefined;
  PropertyDetails: { propertyId: string };
  AddEditProperty: { propertyId?: string };
  AddEditLocation: { locationId?: string };
  LeadDetails: { leadId: string };
  Statistics: undefined;
  EditProfile: undefined;
  Schedules: undefined;
  SubscriptionDetails: { subscription: any };
  SubscriptionPlans: undefined;
  Onboarding: undefined;
  Login: undefined;
};

export type AuthNavigationProp = StackNavigationProp<RootStackParamList>;
