
// needs to be kept in sync with the pythons one

enum ProjectState{
  ANNOTATING = 'ANT',
  REVIEWING = 'RVW',
  REVIEWED = 'RVD',
  COMPLETED = 'CMP',
  SCRAPED = 'SCR',
}

const ValidNextStates = {
  [ProjectState.ANNOTATING]: new Set([ProjectState.SCRAPED, ProjectState.REVIEWING]),
  [ProjectState.REVIEWING]: new Set([ProjectState.SCRAPED, ProjectState.REVIEWED]),
  [ProjectState.REVIEWED]: new Set([ProjectState.SCRAPED, ProjectState.COMPLETED, ProjectState.ANNOTATING]),
  [ProjectState.COMPLETED]: new Set([]),
  [ProjectState.SCRAPED]: new Set([]),
}

function isValidProjectState(state: string): ProjectState|null {
  switch(state){
      case ProjectState.ANNOTATING:
        return ProjectState.ANNOTATING;
      case ProjectState.REVIEWING:
        return ProjectState.REVIEWING
      case ProjectState.REVIEWED:
        return ProjectState.REVIEWED;
      case ProjectState.COMPLETED:
        return ProjectState.COMPLETED;
      case ProjectState.SCRAPED:
        return ProjectState.SCRAPED;
      default:
        return null;
  }
}

function isValidNextProjectState(prevState: ProjectState, nextState: ProjectState): boolean {
  console.log('checking transistion validity from ', prevState, ' to ', nextState);
  return ValidNextStates[prevState]?.has(nextState as never) ?? false;
}


enum Permission {

    PROJECTS_CHANGE_STATE_TO_ANNOTATING = 'projects.change_state_to_annotating',
    PROJECTS_CHANGE_STATE_TO_REVIEWING = 'projects.change_state_to_reviewing',
    PROJECTS_CHANGE_STATE_TO_REVIEWED = 'projects.change_state_to_reviewed',
    PROJECTS_CHANGE_STATE_TO_COMPLETED = 'projects.change_state_to_completed',
    PROJECTS_CHANGE_STATE_TO_SCRAPED = 'projects.change_state_to_scraped',

    ORGANIZATIONS_CREATE = 'organizations.add_organization',
    ORGANIZATIONS_VIEW = 'organizations.view_organization',
    ORGANIZATIONS_CHANGE = 'organizations.change_organization',
    ORGANIZATIONS_DELETE = 'organizations.delete_organization',
    ORGANIZATIONS_INVITE = 'organizations.invite',
    PROJECTS_CREATE = 'projects.add_project',
    PROJECTS_VIEW = 'projects.view_project',
    PROJECTS_CHANGE = 'projects.change_project',
    PROJECTS_DELETE = 'projects.delete_project',
    TASKS_CREATE = 'tasks.add_task',
    TASKS_VIEW = 'tasks.view_task',
    TASKS_CHANGE = 'tasks.change_task',
    TASKS_DELETE = 'tasks.delete_task',
    ANNOTATIONS_CREATE = 'annotations.add_annotation',
    ANNOTATIONS_VIEW = 'annotations.view_annotation',
    ANNOTATIONS_CHANGE = 'annotations.change_annotation',
    ANNOTATIONS_DELETE = 'annotations.delete_annotation',

    DATA_IMPORT_CREATE = 'data_import.add_fileupload',
    DATA_IMPORT_VIEW = 'data_import.view_fileupload',
    DATA_IMPORT_CHANGE = 'data_import.change_fileupload',
    DATA_IMPORT_DELETE = 'data_import.delete_fileupload',

    DATA_EXPORT_VIEW = 'data_export.view_export',
    DATA_EXPORT_DELETE = 'data_export.delete_export',
    DATA_EXPORT_CREATE = 'data_export.add_export',
    DATA_EXPORT_CHANGE = 'data_export.change_export',

    PROJECTS_IMPORT_CREATE = 'projects.add_projectimport',
    PROJECTS_IMPORT_VIEW = 'projects.view_projectimport',
    PROJECTS_IMPORT_CHANGE = 'projects.change_projectimport',
    PROJECTS_IMPORT_DELETE = 'projects.delete_projectimport',

    PROJECTS_REIMPORT_CREATE = 'projects.add_projectreimport',
    PROJECTS_REIMPORT_VIEW = 'projects.view_projectreimport',
    PROJECTS_REIMPORT_CHANGE = 'projects.change_projectreimport',
    PROJECTS_REIMPORT_DELETE = 'projects.delete_projectreimport',

}


/*
Convetion: <resource>_<action>_<component>
*/
enum Component {
  PROJECT_CREATE_BUTTON,
  PROJECT_SETTINGS_BUTTON,
  PROJECT_DANGER_ZONE_BUTTON,

  // Importing data in the project
  PROJECT_IMPORT_BUTTON,
  // Exporting data from the project
  PROJECT_EXPORT_BUTTON,

  PROJECT_SUBMIT_FOR_REVIEW_BUTTON,
  PROJECT_SUBMIT_FOR_ANNOTATION_BUTTON,
  PROJECT_MARK_AS_REVIEWED_BUTTON,
  PROJECT_MARK_AS_COMPLETED_BUTTON,
  PROJECT_SCRAPE_BUTTON,

}


const RequiredComponentPermissions: {readonly [key in Component]: readonly Permission[]} = {
  [Component.PROJECT_CREATE_BUTTON]: [
    Permission.PROJECTS_CREATE, // for creating the thing
    Permission.PROJECTS_CHANGE, // for updating the labels and other configs
    Permission.PROJECTS_DELETE, // for deleting the project in case of accidental creation or some other stuff
  ],
  [Component.PROJECT_SETTINGS_BUTTON]: [
    Permission.PROJECTS_CHANGE,
    Permission.PROJECTS_DELETE,
  ],
  [Component.PROJECT_DANGER_ZONE_BUTTON]: [
    Permission.PROJECTS_DELETE,
  ],
  [Component.PROJECT_IMPORT_BUTTON]: [
    Permission.DATA_IMPORT_CREATE, // data import flow includes, file upload, reimport of project, instead of having all permissions, currently using only the DATA_IMPORT_CREATE one to bypass all of the permission
  ],
  [Component.PROJECT_EXPORT_BUTTON]: [
    Permission.DATA_EXPORT_VIEW,
  ],

  [Component.PROJECT_SUBMIT_FOR_REVIEW_BUTTON]: [
    Permission.PROJECTS_CHANGE_STATE_TO_REVIEWING,
  ],
  [Component.PROJECT_SUBMIT_FOR_ANNOTATION_BUTTON]: [
    Permission.PROJECTS_CHANGE_STATE_TO_ANNOTATING,
  ],
  [Component.PROJECT_MARK_AS_REVIEWED_BUTTON]: [
    Permission.PROJECTS_CHANGE_STATE_TO_REVIEWED,
  ],
  [Component.PROJECT_MARK_AS_COMPLETED_BUTTON]: [
    Permission.PROJECTS_CHANGE_STATE_TO_COMPLETED,
  ],
  [Component.PROJECT_SCRAPE_BUTTON]: [
    Permission.PROJECTS_CHANGE_STATE_TO_SCRAPED,
  ],
} as const;


const currentUserPermissions: readonly string[] = (()=>{
  let _userPermissions = window.APP_SETTINGS.user.granted_permissions;
  console.log(`_userPermissions: ${_userPermissions}`);
  if(!Array.isArray(_userPermissions)){
    _userPermissions = [];
  }
  const userPermissions : string[] = [];
  for(const permission of _userPermissions){
    if(typeof(permission) === 'string'){
      userPermissions.push(permission);
    }
  }
  return userPermissions;
})()
// console.log('currentUserPermissions = ', currentUserPermissions);

// Checks permissions to show a component
function shouldShowComponent(component: Component): boolean{
  for(const requiredPermission of RequiredComponentPermissions[component]){
    if(currentUserPermissions.indexOf(requiredPermission) === -1){
      // console.log(`doesn't have ${requiredPermission}`);
      return false;
    }
  }
  return true;
}

// console.log(`shouldShowComponent(ProjectImportButton); = ${shouldShowComponent(Component.PROJECT_IMPORT_BUTTON)}`);
// console.log(`shouldShowComponent(Settings) = ${shouldShowComponent(Component.PROJECT_SETTINGS_BUTTON)}`);
export {
  Component,
  shouldShowComponent,
  isValidProjectState,
  isValidNextProjectState,
  ProjectState,
};
