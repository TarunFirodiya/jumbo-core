/**
 * Profile Service — backward compatibility wrapper
 * All logic now lives in team.service.ts.
 * Import from team.service directly for new code.
 */
export {
  createTeamMember as createProfile,
  getTeamMemberById as getProfileById,
  getTeamMemberByPhone as getProfileByPhone,
  getTeamMemberByEmail as getProfileByEmail,
  getTeamMembersByRole as getProfilesByRole,
  updateTeamMember as updateProfile,
  deleteTeamMember as deleteProfile,
  updateCoinBalance,
  findOrCreateTeamMemberByPhone as findOrCreateProfileByPhone,
} from "./team.service";
