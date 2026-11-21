# Du coq à l'âne — génération des échelles

`data/ladders-fr.json` et `data/ladders-en.json` contiennent des échelles de mots : départ, une solution la plus courte, arrivée. Le par vaut le nombre de mots moins un.

- Français : `python3 -I gen-fr.py Lexique383.tsv 4`, avec [Lexique 3.83](http://www.lexique.org/) (New, Pallier et al., licence CC BY-SA 4.0). Les mots du chemin ont une fréquence d'au moins 4 par million ; les départs et arrivées, d'au moins 15 et sont au singulier. Mots vulgaires et formes rares (passé simple, imparfait du subjonctif) exclus.
- Anglais : `python3 -I gen-en.py enable1.txt en_50k.txt`, avec la liste ENABLE (domaine public) et [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles 2018, CC BY-SA 4.0).

Après génération, quelques mots bizarres ont été retirés à la main (voir l'historique git).
