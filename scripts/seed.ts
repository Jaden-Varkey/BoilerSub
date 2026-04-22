import { demoStorePath, getDemoData, resetDemoData } from "../src/data/demoStore.js";

async function main(): Promise<void> {
  const state = resetDemoData();
  console.log(
    JSON.stringify({
      success: true,
      mode: "demo",
      store: demoStorePath,
      usersSeeded: state.users.length,
      listingsSeeded: state.listings.length,
      sampleUsers: getDemoData().users.slice(0, 3).map((user) => ({
        email: user.email,
        password: user.password,
      })),
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
