import { createOrganization } from "../organizations/createOrganization";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

const onUserCreate = async (newUser: {
  id: string;
  email: string | null;
  name?: string | null;
}) => {
  const name = newUser.name
    ? `${newUser.name}'s Space`
    : uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: " ",
        style: "capital",
      });
  await createOrganization({
    name,
    userId: newUser.id,
  });
  // TIP: Send welcome email to user
};

export default onUserCreate;
