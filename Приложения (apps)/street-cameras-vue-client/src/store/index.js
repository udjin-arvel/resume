import { createStore } from 'vuex';
import { AuthService } from "@/services/AuthService";
import { VideoService } from "@/services/VideoService";
import { cameraType, API_WS_URL } from '../params';
import axios from "axios";

export default createStore({
  state: {
    user: {},
    isAuth: Boolean(AuthService.getUserName()),
    cameras: [],
    filters: {},
    tags: [],
    regions: [],
    myCameras: VideoService.getStoredMyCameras(),
    isLoading: false,
    isCitiesModalShow: false,
    serverOffset: 0,
    geoData: null,
  },
  mutations: {
    SET_USER: (state, payload) => {
      if (payload) {
        state.user = payload;
        state.isAuth = true;
      } else {
        state.user = { address: {} };
        state.isAuth = false;
      }
    },
    SET_CAMERAS: (state, payload) => {
      if (payload && payload.length > 0) {
        if (state.user.address) {
          state.cameras = payload.sort(camera => state.user.address.city === camera.Address.City ? -1 : 1);
        } else {
          state.cameras = payload;
        }

        let additionalCameras = [];

        for (const camera of state.cameras) {
          if (camera.CamType === cameraType.PRIVATE && !~state.myCameras.indexOf(camera.Id)) {
            additionalCameras.push(camera.Id);
          }
        }

        if (additionalCameras.length) {
          state.myCameras.unshift(...additionalCameras);
        }

        VideoService.localStoreMyCameras(state.myCameras);
      }
    },
    FILTER_ONLY_PUBLIC_CAMERAS: (state) => {
      state.cameras = state.cameras.filter(camera => camera.CamType !== cameraType.PRIVATE);
    },
    SET_CAMERAS_FILTERS: (state, filters) => {
      state.filters = filters;
    },
    TOGGLE_LOADING: (state, payload) => {
      state.isLoading = Boolean(payload);
    },
    TOGGLE_CITY_MODAL: (state, payload) => {
      state.isCitiesModalShow = Boolean(payload);
    },
    ADD_MY_CAMERAS: (state, ids) => {
      state.myCameras = state.myCameras.concat(ids.filter(id => !~state.myCameras.indexOf(id)));
      VideoService.localStoreMyCameras(state.myCameras);
    },
    REMOVE_MY_CAMERA: (state, id) => {
      state.myCameras = state.myCameras.filter(cameraId => cameraId !== id);
      VideoService.localStoreMyCameras(state.myCameras);
    },
    CLEAR_MY_CAMERAS: (state) => {
      const personalCameras = state.cameras
        .filter(camera => camera.CamType === cameraType.PRIVATE)
        .map(camera => camera.Id);

      state.myCameras = Object.values(personalCameras);
      VideoService.localStoreMyCameras(state.myCameras);
    },
    SET_TAGS: (state, payload) => {
      let tags = [];

      for (const camera of payload) {
        tags = tags.concat(camera.tags);
      }

      state.tags = tags.filter((tag, index, self) => self.indexOf(tag) === index).sort();
    },
    SET_REGIONS: (state, payload) => {
      let regions = [];

      for (const camera of payload) {
        if (camera.Address.Region) {
          regions.push(camera.Address.Region);
        }
      }

      state.regions = regions.filter((region, index, self) => self.indexOf(region) === index).sort();
    },
    SET_SERVER_OFFSET: (state, payload) => {
      if (payload) {
        state.serverOffset = payload;
      }
    },
    SET_GEO: (state, payload) => {
      state.geoData = payload;
    },
  },
  actions: {
    AUTH: async (context, {login, password}) => {
      return await AuthService.login(login, password);
    },
    GET_CONTRACT: async ({ commit }) => {
      const user = await AuthService.getContract();
      commit('SET_USER', user);
      return user;
    },
    GET_SERVER_OFFSET: async ({ commit }) => {
      const timestamp = +new Date();
      const response = await axios.get(`${API_WS_URL}get-server-time-offset?timestamp=${timestamp}`);
      
      commit('SET_SERVER_OFFSET', response?.data?.offset);
      
      return true;
    },
    GET_CAMERAS: ({ commit }) => {
      commit('TOGGLE_LOADING', true);

      const getCameras = async (position) => {
        let coords = {};

        if (position && position.coords) {
          coords = position.coords;
          commit('SET_GEO', coords);
        }

        const cameras = await VideoService.getCams(AuthService.getUserName(), coords);

        commit('SET_CAMERAS', cameras);
        commit('SET_TAGS', cameras);
        commit('SET_REGIONS', cameras);

        commit('TOGGLE_LOADING', false);
      };

      navigator.geolocation.getCurrentPosition(getCameras, getCameras);
    },
  },
  getters: {
    cameras: state => state.cameras,
    myCameras: state => state.cameras.filter(camera => ~state.myCameras.indexOf(camera.Id)),
    myCamerasIds: state => state.myCameras,
    tags: state => state.tags,
    regions: state => state.regions,
    user: state => state.user,
    isAuth: state => state.isAuth,
    serverOffset: state => state.serverOffset,
    isLoading: state => state.isLoading,
    isCitiesModalShow: state => state.isCitiesModalShow,
    geoData: state => state.geoData,
    filters: state => state.filters,
    filteredCameras: state => {
      let cameras = state.cameras;

      if (Object.values(state.filters).length) {
        const { regions, cities, tags, types } = state.filters;

        if (regions.length) {
          cameras = cameras.filter(camera => ~regions.indexOf(camera.Address.Region));
        }
        if (cities.length) {
          cameras = cameras.filter(camera => ~cities.indexOf(camera.Address.City));
        }
        if (tags.length) {
          cameras = cameras.filter(camera => tags.filter(tag => camera.tags.includes(tag)).length);
        }
        if (types.length) {
          cameras = cameras.filter(camera => ~types.indexOf(camera.CamType));
        }

        return cameras;
      }

      return cameras;
    },
  },
})
