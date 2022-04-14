import { runATCommands } from '@/command-runner';
import { sum } from '@/mylib/sum';

async function main() {
    await runATCommands();
    sum(10, 10);
}

main().catch(err => {
    console.log('Error: ', err);
    process.exit(1);
});
