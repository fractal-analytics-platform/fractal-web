<script>
	import { userStore } from '$lib/stores/authStores'
	import { goto } from '$app/navigation'
	userStore.set(undefined)
	goto('/')
</script>