export function describe(node) {
 const name=node.label.split('/').pop();
 const roles={
 'hosted-client.js':['Web app connector','Connects the page to account and repository services.','Browser experience'],
 'client.js':['Account & repository screens','Handles the buttons and forms people use to sign in and choose their repository.','Browser experience'],
 'hosted-auth.js':['Account sessions','Helps the browser use the managed sign-in service and keep track of who is signed in.','Browser experience'],
 'github.js':['Repository request entry','Provides the entry point for repository requests from the website.','Hosted repository service'],
 'github-api.js':['Access checks & requests','Checks the signed-in user and routes repository requests to the appropriate helper.','Hosted repository service'],
 'github-store.js':['Protected connection storage','Handles encrypted connection information so access credentials do not need to be exposed in the page.','Hosted repository service'],
 'hosted-scan.js':['Online scan coordinator','Collects supported source from GitHub and prepares the saved software overview.','Hosted repository service'],
 'providers.js':['Account & GitHub connectors','Groups the requests used to talk to the account provider and GitHub.','Shared connections'],
 'scanner.js':['Source relationship reader','Reads source code to find explicit references between files and libraries. It does not run the application.','Scanning & maps'],
 'map.js':['Map document builder','Builds a view of the scan findings for people to explore.','Scanning & maps'],
 'editor-client.js':['Local map editor','Handles interactions in the local map editor.','Scanning & maps'],
 'overlays.js':['Human notes & edits','Keeps human changes separate from the findings detected in source code.','Scanning & maps'],
 'cli.js':['Local scan command','Starts a scan from a developer’s command line.','Local developer tools'],
 'server.js':['Local development server','Serves the local account and repository workflow for development.','Local developer tools'],
 'build-hosted.js':['Website build step','Prepares website files for hosting.','Build tools'],
 'build-preview.js':['Preview build step','Prepares the earlier preview website files.','Build tools'],
 'scan-self.js':['Project scan helper','Provides a local helper for scanning this project.','Local developer tools']
 };
 if(node.kind==='package-reference') return {title:node.label,explanation:'A library or built-in module referenced by the code. A reference alone does not prove it runs or is a deployed service.',group:'Referenced libraries',basis:'Detected source reference'};
 const role=roles[name];
 return {title:role?.[0]||name.replace(/\.[^.]+$/,'').replaceAll('-',' '),explanation:role?.[1]||'A source file in this project. Open its connections to see what it references.',group:role?.[2]||'Other source',basis:role?'Suggested role · inferred from file name and project structure':'Detected source file'};
}
export function model(scan){
 const nodes=scan.nodes.map(n=>({...n,...describe(n)}));
 return {...scan,nodes,groups:[...new Set(nodes.map(n=>n.group))].map((label,i)=>({id:'group-'+i,label,nodes:nodes.filter(n=>n.group===label).map(n=>n.id)}))};
}
