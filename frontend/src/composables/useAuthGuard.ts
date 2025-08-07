import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { useAuth } from "./useAuth";

export function useAuthGuard() {
  const { checkAuth } = useAuth();
  const router = useRouter();

  onMounted(async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/login");
    }
  });
}
