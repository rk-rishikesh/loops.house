Notes:

GL creates a Premade Hackathon on FOC filled with all data via Frontend
List down list of
We add Jenny’s email and Molly’s email as Co-Host for a FOC hackathon do this via on frontend - Nick Lionis
User logs in he sees - my project, explore hackathons, explore residency, explore project gallery, my events
If user is builder he goes for builder flow my events tab wud say no events so far
If user is judge/host/cohost he can see all builder flow in event section he can see the events he is host/cohost/judge of and if in builder flow he clicks on an event he is judge/cohost/host of he will see the host flow and not the builder flow/cant submit project there only for that specific event.
Replace all img inputs to upload instead of using url
Use vercel blobs
Include hackathon stats in host/hackathon/analytics page not only ai-analytics
Allow AI hackathon analysis right before the hackathon finalization ?
Should we store the historical AI analytics ?
NO THIS IS A ONE TIME FLOW. METRICS COME STRAIGHT FROM DB.
We are on Judging period and the Judge can see the ai evaluation “only if there is no ai-avaluation” then they can trigger one time the ai-evaluation and this is going to be global for every judge
Remove manual human AI evaluation overriding feature
In the judging page we need to add
Rishikesh Kale chat with project
Rishikesh Kale link to project page (important hackathon project page)
Do not allow additional judging human criteria
Host hackathon specific page we need to
Replace invite judges card/btn with finalize results
This is going to be a new page showing the results based on judging
Host might be able to adjust and submit
Future features would be to define different calcs to determine results.
Which formula to use which criterion has more weight or something like that. Or is it just AI based no human intervention?
They can define that only top 5 get money
After submission add results in DB and render leaderboard on public hackathon page no money involved for now
Only allow one project submission per user/hackathon
Check out bugs involved in my projects not showing up all my projects

ROLES REFACTOR NOTES

REDIFINE INVITATIONS ROLES AND RELATIONSHIPS

WE SHOULD REMOVE THE BUILDER ROLE. ANYONE CAN BE A BUILDER.
WE SHOULD REMOVE THE VIEWR ROLE, VIEWER IS THE DEFAULT ROLE REDUNDANT ROLE. VIEWER ROUTE GOT REPLACED WITH JUST projects and hackathons routes no need to login to view projects and hackathons.

REDIFINE ROLES

ROLES FOR NOW SHOULD BE AS

email: NO NEED TO BE REGISTERED IN THE PLATFORM/DATABASE.
userId: defined after user signs up.

<!-- ONLY ADMIIN CAN INVITE EVENT HOSTS -->

event_host_invitation: {
invitedAt: Date
invitedBy: string // userId of the user who invited the event host should be [admin]
}
event_creator: host ability boolean defined from the admin panel. Allows user to create hackathons.

<!-- ONLY COHOST CAN INVITE JUDGES -->

judge_invitation: {
invitedAt: Date
hackathon_id: string
invitedBy: string // userId of the user who invited the judge should be [admin, cohost, event_creator]
}
judge: [hackathon_id] array of hackathon ids the user id is a judge of.

<!-- ONLY EVENT CREATOR CAN ADD COHOSTS -->

cohost_invitation: {
invitedAt: Date
hackathon_id: string
invitedBy: string // userId of the user who invited the cohost should be [admin, event_creator]
}
cohost: [hackathon_id] array of hackathon ids the user id is a cohost of. - Event creator can add cohosts to their event. - Event creator is a cohost at event creation - Cohost can manage-edit event details. - Cohost can manage-edit-invite event judges.

<!-- ONLY TEAM OWNER CAN ADD MEMBERS TO THE TEAM -->

project_invitation: {
invitedAt: Date
project_id: string
invitedBy: string // userId of the user who invited the member should be [admin, project_owner]
}

member: [project_id] array of project ids the member is a member of.

INVITATIONS SHOULD GET REMOVED AFTER ACCEPTANCE OR REJECTION. ONCE A USER SIGNSUP THE BACKEND SHOULD CHECK OUT FOR THEIR EMAIL IN THE DATABASE AND IF THEY HAVE AN INVITATION THEY SHOULD BE NOTIFIED AND THE INVITATION SHOULD BE REMOVED AFTER ACCEPTANCE OR REJECTION. THE BACKEND SHOULD ALSO CHECK OUT THAT THE INVITATION INVITED BY STILL HAS THE ROLE TO INVITE THE USER.

- NOW INVITATIONS JUDGE OR TEAM MEMBERS INVITATIONS REQUIRE THE RECEIVER TO HAVE AN ACCOUNT IN THE PLATFORM/DATABASE
  - WE NEED TO REMOVE THIS REQUIREMENT. BUT AT THE SAME TIME WE NEED
    1. IN THE FUTURE SEND AN EMAIL TO THE RECEIVER ABOUT THE INVITATION CONTEXT USING RESEND PROPER USAGE OF SUPABASE.
       - FOR NOW KEEP THAT AS A TODO COMMENT AFTER MAKING THE INVITATION.

REDIFINE DASHBOARDS AND SIDENAV.

SIDEBAR SHOULD BE REDIFINED IT SHOULD BE EXPANDED BY DEFAULT TO SHOW TOGHETHER WITH THE ICON THE LABEL OF THE ITEM AS WELL. IT SHOULD ALSO HAVE A TOGGLE TO COLLAPSE THE SIDEBAR. AUTO COLLAPSE ON SMALLER SCREENS.

CURRENTLY WE HAVE A BUILDER DASHBOARD AND A HOST DASHBOARD. WE SHOULD REDIFINE THE DASHBOARDS TO BE MORE USER FRIENDLY AND EASY TO USE.

WE SHOULD HAVE ONE MAIN DASHBOARD FOR ALL ROLES.

    - FOR NOW WE CAN MAKE THIS SHOWCASE RECENT, UPCOMING HACKATHONS, RESIDENCIES

THE SIDENAV SHOULD RENDER DIFFERENT ITEMS DEPENDING ON THE ROLE OF THE USER.

PUBLIC ROUTES SHOULD BE PUBLIC AND SHOULD NOT REQUIRE LOGIN. VISIBLE FOR ALL USERS IN SIDENAV.

PROTECTED ROUTES SHOULD BE PROTECTED AND SHOULD REQUIRE LOGIN. SHOULD NOT BE VISIBLE FOR ALL USERS IN SIDENAV.

EVENT CREATOR ROUTES SHOULD BE EVENT CREATOR ONLY AND SHOULD NOT BE VISIBLE FOR ALL USERS IN SIDENAV.

    - COHOST ROUTES SHOULD BE COHOST ONLY AND SHOULD NOT BE VISIBLE FOR ALL USERS IN SIDENAV. COHOST CAN SEE EVERYTHING THE HOST EVENT CREATOR CAN SEE. EXCEPT THE CREATE NEW EVENT BUTTON. EDIT EVENT DETAILS BUTTON go to host/[hackathon_id]/edit. INVITE JUDGES BUTTON go to host/[hackathon_id]/invite-judges.

JUDGE ROUTES SHOULD BE JUDGE ONLY AND SHOULD NOT BE VISIBLE FOR ALL USERS IN SIDENAV.

    - Judge dashboard (/judge) should have a list of hackathons they are judging from there they can click on a hackathon go to (judge/[hackathon_id]) which will have the judging page for that specific hackathon. List of the projects to judge. status of the judging pending, in progress, judged. on click of the project go to (judge/[hackathon_id]/[project_id]) which will have the judging page for that specific project.

BUILDER ROUTES SHOULD BE VISIBLE FOR ALL LOGGED IN USERS IN SIDENAV.

    - Builder dashboard (/builder) should have a list of projects they are building (projects they are members of) from there they can click on a project go to (builder/projects/[project_id]) which will have the builder page for that specific project. Project owner can invite members to the project. Anyone can edit the project details. Display the hackathons the project is applied to. On click of the hackathon go to (hackathons/[hackathon_id]) which will have the hackathon page for that specific hackathon.

NOTIFICATIONS ICON SHOULD GET THE USER INTO THE NOTIFICATIONS PAGE.

NOTIFICATIONS PAGE SHOULD SHOW THE NOTIFICATIONS FOR THE USER. ABILITY TO ACCEPT OR REJECT THE NOTIFICATION.

SUPER IMPORTANT NOTE:

EVERY ACTION SHOULD BE RENDERED CONDITIONALLY FOR EACH ROLE ACTIONS BASED ON THE HACKATHON PERIOD

- BUIDLING PHASE: APPLICATIONS OPEN, SUBMISSIONS OPEN (ALLOW APPLYING TO HACKATHON, ALLOW SUBMITTING PROJECTS)
- JUDGING PHASE: SUBMISSIONS CLOSED, JUDGING OPEN
- FINALIZATION PHASE: JUDGING CLOSED (EDIT JUDGES DISABLED) (EDIT JUDGEMENTS FROM JUDGES DISABLED)
- COMPLETED PHASE: HACKATHON COMPLETED, RESULTS GOES LIVE HACKATHON PAGE SHOWS RESULTS AND LEADERBOARD.
