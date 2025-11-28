import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const gitRequest = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  withCredentials: true
})

export const getGitStatus = () => gitRequest.get('/git/status')

export const getGitLog = (limit = 15) => gitRequest.get('/git/log', { params: { limit } })

export const getBranchStatus = () => gitRequest.get('/git/branch-status')

export const gitPull = () => gitRequest.post('/git/pull')

export const gitDeploy = (commitMessage) => gitRequest.post('/git/deploy', { commit_message: commitMessage })
