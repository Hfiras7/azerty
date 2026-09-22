// Configuration Supabase
// IMPORTANT: Remplacez ces valeurs par vos propres clés Supabase
// Obtenez-les depuis: https://app.supabase.com/ > Settings > API

const supabaseConfig = {
  url: "https://hnjlakkqykbpedwrvzgg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhuamxha2txeWticGVkd3J2emdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5Mzg2MzUsImV4cCI6MjA3OTUxNDYzNX0.GD1BOWT41r8n48m3HKRuyg55O4iefu7MhqWMdcgYULI"
};

export default supabaseConfig;

/*
INSTRUCTIONS POUR CONFIGURER SUPABASE:

1. Allez sur https://supabase.com/
2. Créez un compte (GitHub recommandé - SANS carte bancaire)
3. Créez un nouveau projet
4. Allez dans Settings > API
5. Copiez :
   - Project URL → url
   - anon public key → anonKey
6. Remplacez les valeurs ci-dessus

ENSUITE:
1. Suivez SUPABASE_SETUP.md pour créer les tables
2. Configurez Row Level Security
3. Créez le premier admin master
4. L'application sera prête !

SÉCURITÉ:
- N'utilisez QUE la clé anon (publique)
- NE METTEZ JAMAIS la clé service_role dans le frontend
- Les règles RLS protègent vos données
*/
