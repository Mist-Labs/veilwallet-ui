// Export ABIs from JSON files
import AccountFactoryAbi from './AccountFactory.json';
import SmartAccountAbi from './SmartAccount.json';
import VeilTokenAbi from './VeilToken.json';
import VerifierAbi from './Verifier.json';
import PoseidonHasherAbi from './PoseidonHasher.json';

// Export the ABI arrays directly
export const ACCOUNT_FACTORY_ABI = AccountFactoryAbi.abi;
export const SMART_ACCOUNT_ABI = SmartAccountAbi.abi;
export const VEIL_TOKEN_ABI = VeilTokenAbi.abi;
export const VERIFIER_ABI = VerifierAbi.abi;
export const POSEIDON_HASHER_ABI = PoseidonHasherAbi.abi;

// Export full artifacts (includes bytecode, etc.)
export { default as AccountFactoryArtifact } from './AccountFactory.json';
export { default as SmartAccountArtifact } from './SmartAccount.json';
export { default as VeilTokenArtifact } from './VeilToken.json';
export { default as VerifierArtifact } from './Verifier.json';
export { default as PoseidonHasherArtifact } from './PoseidonHasher.json';

