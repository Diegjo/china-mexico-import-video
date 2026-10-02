import s1 from './s1_hook.js';
import s2 from './s2_proveedor.js';
import s3 from './s3_incoterms.js';
import s4 from './s4_flete.js';
import s5 from './s5_aduana.js';
import s6 from './s6_costo.js';
import s7 from './s7_cierre.js';

// Ordered back to front. Each scene: { id, start, end, pre?, post?, cues, draw(g, localT, globalT) }.
export const SCENES = [s1, s2, s3, s4, s5, s6, s7];
