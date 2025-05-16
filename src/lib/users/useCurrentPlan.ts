
import useOrganization from "../organizations/useOrganization";

const useCurrentPlan = () => {
  const { organization, isLoading, error } = useOrganization();

  return { currentPlan: organization?.plan, isLoading, error };
};

export default useCurrentPlan;
