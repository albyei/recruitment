# Recruitment-Portal
Centralized recruitment portal for Wowrack.
This repository contains backend, frontend, and DevOps configurations in a single monorepo.

## Repository Structure
recruitment-portal/ 
├── backend/ # Golang backend service 
├── frontend/ # React frontend application 
├── devops/ # CI/CD and deployment configuration 
│   ├── Jenkinsfile 
│   └── docker-compose.yml 
├── docs/ # Project documentation 
└── README.md

## Branching Strategy
### main
Stable branch intended for production deployment
### develop
Active development branch used for integration and testing

All features branches should be merged into develop first and promoted to main via Pull Request

## Development Workflow (High Level)
1. Backend and fronntend are developed separately.
2. Source code will be integrated into this repository.
3. CI/CD pipeline is managed using Jenkins
4. Deployment target: Ubuntu server (provided by mentor)

## CI/CD Overview
- CI/CD is handled using **Jenkins**
- Pipeline triggers on push to _develop_ and _main_
- Appication is built and deployed using **Docker** and **Docker Compose**
Detailed deployment steps are in _docs/deployment.md_

## Roles
- **Backend:** Golang (Gin Framework)
- **Frontend:** React
- **DevOps:** CI/CD, Docker, Jenkins, Deployment

## Notes
This repository is prepared to support collaborative develpoment and deployment. Some components (source code, server configuration) will be finalized after infrastucture is provided.
