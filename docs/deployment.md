# Deployment Guide - Recruitment Portal

## Environment
- OS: Ubuntu 24.04
- Container Runtime: Docker
- Orchestration: Docker Compose
- CI/CD: Jenkins
- Server:
  - server 1: Primary development / production
  - server 2: Backup / stanby / QA
  - server 3: Development / testing

## Prerequesites
- Docker installed
- Docker Compose installed
- Git installed
- Access via Bastion Host

## CI/CD
- Jenkins is installed on server 1
- Jenkins deploys application to target server via SSH

## Deployment Flow (High Level)
1. Developer pushes code to Github (develop/main)
2. Jenkins pipeline is triggered
3. Jenkins builds Docker images
4. Docker Compose deploys containers on target server
5. Applications is accessible via domain

## Netwrok Access
- Access to internal servers is done via Bastion Host
- Local tunneling is required for browser access

## Notes 
Actual service ports, environment variables, and image names will be finalized once backend and frontend code are available.

