export function inviteTemplate(data: {
  name?: string;
  inviteLink: string;
}) {
  return {
    subject: "Complete your onboarding",
    html: `
      <p>Hello ${data.name ?? "there"},</p>
      <p>Please complete your onboarding:</p>
      <a href="${data.inviteLink}">Start onboarding</a>
    `
  };
}
