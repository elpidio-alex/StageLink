export { applicationInputSchema, missionInputSchema } from "@/lib/validations";
// Ceci est un commentaire sur une ligne

export function calculateMatchScore(
  requiredSkills: string[],
  studentSkills: string[],
  estimatedHours: number,
  availableHours: number,
) {
  const studentSkillSet = new Set(
    studentSkills.map((skill) => skill.toLowerCase()),
  );
  const skillMatches = requiredSkills.filter((skill) =>
    studentSkillSet.has(skill.toLowerCase()),
  ).length;
  const skillScore = requiredSkills.length
    ? (skillMatches / requiredSkills.length) * 60
    : 0;
  const availabilityScore =
    availableHours >= estimatedHours
      ? 40
      : Math.max(0, (availableHours / estimatedHours) * 40);
  return Math.min(100, Math.round(skillScore + availabilityScore));
}
