import axios from "axios";
import { API_WS_URL } from "../params";

export class VideoService {
  static async getCams(login, coords = {}) {
    try {
      const url = `${API_WS_URL}camera/list`;
      const hasFullCoords = coords && coords.longitude && coords.latitude;

      const payload = {
        user: login ?? "",
        longitude: hasFullCoords ? coords.longitude : "",
        latitude: hasFullCoords ? coords.latitude : "",
        radius: 50,
      };

      // if (coords.longitude && coords.latitude) {
      //     if (location.hostname === 'localhost') {
      //         url += `&latitude=45.088229&longitude=39.007649&radius=100`; // dev code
      //     } else {
      //         url += `&latitude=${coords.latitude}&longitude=${coords.longitude}&radius=50`;
      //     }
      // }

      const response = await axios.post(url, payload);

      if (response.status === 200 || response.status === 201) {
        return response.data;
      }

      return [];
    } catch (error) {
      // console.error(error);
      return false;
    }
  }

  static localStoreMyCameras(cameras) {
    localStorage.setItem("MY_CAMERAS", cameras);
  }

  static getStoredMyCameras() {
    const cameras = localStorage.getItem("MY_CAMERAS");
    return cameras
      ? cameras.split(",").map((cameraId) => Number(cameraId))
      : [];
  }
}
