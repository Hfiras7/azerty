# -*- coding: utf-8 -*-
"""
Corrige la logique spatiale de la diapositive d'accueil (data/page5.xml).

Trois problèmes :
  - la zone d'action était placée en hauteur, au niveau de la paillasse :
    le joueur devait faire marcher le pharmacien « sur » le mobilier ;
  - rien n'empêchait le personnage de se déplacer au-dessus du sol ;
  - la porte d'arrivée n'était pas matérialisée (elle l'est désormais
    dans le décor, à gauche, là où le pharmacien apparaît).

Le repère d'un personnage est le milieu de ses pieds : les coordonnées
ci-dessous se lisent donc comme des positions au sol.

Usage : python3 tools/corriger-scene-accueil.py
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHEMIN = os.path.join(ROOT, 'data', 'page5.xml')

# Ligne de sol : sous les meubles, le pharmacien ne peut pas monter plus haut.
SOL_Y = 508

BLOC_COLLISION = (
    '<bloc><type>gamecollide</type>\n'
    '<fts>20</fts><fts2>20</fts2>\n'
    '<ids></ids><st></st>'
    f'<x>0</x><y>0</y><w>960</w><h>{SOL_Y}</h>'
    f'<x2>0</x2><y2>0</y2><w2>960</w2><h2>{SOL_Y}</h2>'
    '<o>0</o><o2>0</o2><acl>0</acl><pp>0</pp><an>1</an><de>0</de>'
    '<di>0</di><dedi>0</dedi><domaine>0</domaine>\n'
    '<text><![CDATA[fx/transparent.png]]></text>\n'
    '<color>#000000</color>\n'
    '<css>border: solid 0px transparent;</css>\n'
    '<ind>1</ind>\n'
    '</bloc>'
)


def main():
    with open(CHEMIN, encoding='utf-8-sig') as f:
        s = f.read()

    # 1. la zone d'action descend au sol, à droite de la pharmacienne
    ancien = '<x>535</x><y>201</y><w>90</w><h>50</h><x2>195</x2><y2>201</y2><w2>90</w2><h2>50</h2>'
    nouveau = '<x>584</x><y>516</y><w>150</w><h>78</h><x2>195</x2><y2>516</y2><w2>150</w2><h2>78</h2>'
    assert s.count(ancien) == 1, 'zone d’action introuvable'
    s = s.replace(ancien, nouveau)

    # 2. le repère visuel suit la zone, posé juste au-dessus
    ancien_pin = '<x>535</x><y>316</y><w>75</w><h>65</h>'
    assert s.count(ancien_pin) == 1, 'repère d’action introuvable'
    s = s.replace(ancien_pin, '<x>622</x><y>432</y><w>75</w><h>65</h>')

    # 3. zone de collision : tout ce qui est au-dessus de la ligne de sol.
    #    La balise fermante </d> apparaît aussi à l'intérieur de la
    #    diapositive (progsave, bq, param...) : on ne remplace donc que la
    #    toute dernière, celle qui ferme le document.
    if 'gamecollide' not in s:
        fin = s.rindex('</d>')
        s = s[:fin] + BLOC_COLLISION + '\n' + s[fin:]

    with open(CHEMIN, 'w', encoding='utf-8-sig') as f:
        f.write(s)
    print('page5.xml : zone d’action au sol, repère déplacé, collision ajoutée.')


if __name__ == '__main__':
    main()
