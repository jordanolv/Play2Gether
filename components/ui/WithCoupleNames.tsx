import { ReactNode, useState } from 'react';
import { View } from 'react-native';

import { GameHeader } from '@/components/ui/GameHeader';
import { NamesForm } from '@/components/ui/NamesForm';
import { Screen } from '@/components/ui/Screen';
import { CoupleNames, useCoupleNames } from '@/utils/couple';

interface WithCoupleNamesProps {
  title: string;
  glows?: Parameters<typeof Screen>[0]['glows'];
  children: (names: CoupleNames, editNames: () => void) => ReactNode;
}

/** Demande les prénoms du couple avant de lancer un jeu qui les affiche. */
export function WithCoupleNames({ title, glows, children }: WithCoupleNamesProps) {
  const couple = useCoupleNames();
  const [editing, setEditing] = useState(false);

  if (!couple.loaded) return <Screen glows={glows}><View /></Screen>;

  if (!couple.hasNames || editing) {
    return (
      <Screen glows={glows}>
        <GameHeader title={title} />
        <NamesForm
          initial={couple.names}
          onSubmit={(n) => {
            couple.save(n);
            setEditing(false);
          }}
        />
      </Screen>
    );
  }

  return <>{children(couple.names, () => setEditing(true))}</>;
}
