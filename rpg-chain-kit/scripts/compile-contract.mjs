import fs from 'node:fs'; import path from 'node:path'; import solc from 'solc'; import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), sourceName='contracts/RpgItem.sol';
const input={language:'Solidity',sources:{[sourceName]:{content:fs.readFileSync(path.join(root,sourceName),'utf8')}},settings:{optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input),{import:(p)=>{const file=path.join(root,'node_modules',p);return fs.existsSync(file)?{contents:fs.readFileSync(file,'utf8')}:{error:`Missing import: ${p}`}}}));
for(const issue of output.errors??[])console.log(issue.formattedMessage); if((output.errors??[]).some((issue)=>issue.severity==='error'))process.exit(1);
const contract=output.contracts[sourceName].RpgItem; fs.mkdirSync(path.join(root,'artifacts'),{recursive:true}); fs.writeFileSync(path.join(root,'artifacts','RpgItem.json'),JSON.stringify({contractName:'RpgItem',abi:contract.abi,bytecode:`0x${contract.evm.bytecode.object}`},null,2)); console.log('Compiled artifacts/RpgItem.json');
