const base64 = require('base-64');
const fetch = require("node-fetch");

async function fetchProjects() {
  let response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${process.env.TOGGL_WORKSPACE_ID}/projects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64.encode(`${process.env.TOGGL_API_TOKEN}:api_token`)}`
    },
  });
  let json = response.json();
  return json;
}

async function fetchClients() {
  let response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${process.env.TOGGL_WORKSPACE_ID}/clients`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64.encode(`${process.env.TOGGL_API_TOKEN}:api_token`)}`
    },
  });
  let json = response.json();
  return json;
}

async function projectIdToName(projectId) {
  let projects = await fetchProjects();
  let project = projects.find(project => project.id === projectId);
  return project ? project.name : "Project not found";
}

async function clientIdToName(clientId) {
  let clients = await fetchClients();
  let client = clients.find(client => client.id === clientId);
  return client ? client.name: "Client not found";
}

async function getProjectClient(projectName) {
  let projects = await fetchProjects();
  let project = projects.find(project => project.name === projectName);
  let clientId = project.client_id;
  let clientName = await clientIdToName(clientId);
  return clientName;
}

const togglObject = {
  projectIdToName,
  getProjectClient
};
  
module.exports = togglObject