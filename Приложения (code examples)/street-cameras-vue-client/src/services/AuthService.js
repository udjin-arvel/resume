import axios from "axios";
import { API_1C_URL } from "../params";

const HTTP_STATUS_OK = 200;

export class AuthService {
  static keyUserToken = "userJwt";
  static keyUserName = "userName";

  static async login(login, password) {
    try {
      const response = await axios.post(API_1C_URL + "login", {
        login,
        password,
      });

      if (response.data.result.accessToken) {
        localStorage.setItem(
          AuthService.keyUserToken,
          JSON.stringify(response.data.result),
        );
        localStorage.setItem(AuthService.keyUserName, login);
      }

      return { login };
    } catch (error) {
      // console.error(error);
      return false;
    }
  }

  static async getContract() {
    try {
      const response = await axios.post(API_1C_URL + "getContract", {
        fields: ["login", "address"],
      });

      if (response.status === HTTP_STATUS_OK) {
        return response.data.result[0];
      }

      return null;
    } catch (error) {
      // console.error(error);
      AuthService.logout();
      return false;
    }
  }

  static async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        // console.log("No refresh token available");
        return false;
      }
      // Используем axios.create для создания экземпляра без перехватчиков
      const axiosInstance = axios.create();

      const response = await axiosInstance.post(API_1C_URL + "renewToken", {
        refreshToken: refreshToken,
      });

      if (response.status === 200 || response.status === 201) {
        localStorage.setItem(
          AuthService.keyUserToken,
          JSON.stringify(response.data.result),
        );
        // console.log("Token refreshed successfully");
        return true;
      }

      return false;
    } catch (error) {
      // console.error(
      //   "Error refreshing token:",
      //   error.response?.data || error.message,
      // );
      // Не вызываем logout здесь, так как это может привести к циклическим вызовам
      return false;
    }
  }

  static logout() {
    localStorage.removeItem(AuthService.keyUserToken);
    localStorage.removeItem(AuthService.keyUserName);
  }

  static getAccessToken() {
    let storageData = localStorage.getItem(AuthService.keyUserToken);

    if (storageData) {
      storageData = JSON.parse(storageData);
    }

    return storageData && storageData.accessToken
      ? storageData.accessToken
      : null;
  }

  static getRefreshToken() {
    let storageData = localStorage.getItem(AuthService.keyUserToken);

    if (storageData) {
      storageData = JSON.parse(storageData);
    }

    return storageData && storageData.refreshToken
      ? storageData.refreshToken
      : null;
  }

  static getUserName() {
    return localStorage.getItem(AuthService.keyUserName);
  }
}
