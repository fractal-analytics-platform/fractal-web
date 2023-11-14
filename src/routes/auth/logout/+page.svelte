<script>
    import { goto, invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
    
    async function logout() {
        sessionStorage.removeItem('userLoggedIn');
        await fetch(`/auth/token/logout`, {
			method: 'POST',
			credentials: 'include'
		});
        await invalidateAll();
        goto('/');
    };
    
    onMount(() => logout());
</script>

Logging out...