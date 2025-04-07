import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import CrontabsView from "../views/CrontabsView.vue";
import LoginView from "../views/LoginView.vue";
import NotFound from "../views/NotFound.vue";
import CronLogDetail from "../components/CronLogDetail.vue";

const isAuthenticated = () => {
  return localStorage.getItem("auth_token") !== null;
};

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    title?: string;
    layout?: string;
  }
}
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "crontabs",
    component: CrontabsView,
    meta: {
      requiresAuth: true,
      title: "Crontab Management",
    },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      title: "Login",
    },
    beforeEnter: (_, __, next) => {
      if (isAuthenticated()) {
        next({ name: "dashboard" });
      } else {
        next();
      }
    },
  },
  {
    path: '/crontabs/:id/logs',
    name: 'CrontabLogDetail',
    component: CronLogDetail,
    props: route => ({ id: route.params.id })
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFound,
    meta: {
      title: "Page Not Found",
    },
  },
];

const router = createRouter({
  history: import.meta.env.SSR
    ? createMemoryHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, _, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
  } else {
    document.title = `${to.meta.title || "Crontab UI"} - Crontab Manager`;
    next();
  }
});

export default router;
