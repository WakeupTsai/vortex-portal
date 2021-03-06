import axios, { AxiosPromise } from 'axios';
import { User, UserBrief, LoginCredential } from '@/models/User';
import { Response } from '@/models/Query';

export const verify = (token: string) => {
  return axios.get('/v1/users/verify/auth', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const signup = (data: UserBrief): AxiosPromise<User> => {
  return axios.post('/v1/users/signup', data);
};

export const signin = (data: LoginCredential): AxiosPromise<Response> => {
  return axios.post('/v1/users/signin', data);
};

export const updatePassword = (
  data: LoginCredential
): AxiosPromise<Response> => {
  return axios.put('/v1/users/password', data);
};

export const getUsers = (): AxiosPromise<Array<User>> => {
  return axios.get('/v1/users');
};

export const getUser = (id: string): AxiosPromise<User> => {
  return axios.get(`/v1/users/${id}`);
};

export const createUser = (data: UserBrief): AxiosPromise<User> => {
  return axios.post('/v1/users', data);
};

export const deleteUser = (id: string): AxiosPromise<Response> => {
  return axios.delete(`/v1/users/${id}`);
};
