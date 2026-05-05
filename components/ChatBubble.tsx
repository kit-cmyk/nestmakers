import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';

const DOC_PREFIX = 'DOC_SHARE:';

interface Props {
  me: boolean;
  text: string;
}

function DocBubble({ me, url, name }: { me: boolean; url: string; name: string }) {
  const isPdf = name.toLowerCase().endsWith('.pdf');
  return (
    <TouchableOpacity
      style={[s.docBubble, me ? s.me : s.them]}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.75}
    >
      <View style={[s.docIcon, { backgroundColor: me ? 'rgba(255,255,255,0.15)' : NM.lavenderSoft }]}>
        <Ionicons
          name={isPdf ? 'document-outline' : 'image-outline'}
          size={20}
          color={me ? NM.cream : NM.lavenderDeep}
        />
      </View>
      <View style={s.docBody}>
        <Text style={[s.docName, { color: me ? NM.cream : NM.ink }]} numberOfLines={1}>{name}</Text>
        <Text style={[s.docTap, { color: me ? 'rgba(255,255,255,0.65)' : NM.ink3 }]}>Tap to open</Text>
      </View>
      <Ionicons name="open-outline" size={14} color={me ? 'rgba(255,255,255,0.6)' : NM.ink3} />
    </TouchableOpacity>
  );
}

export default function ChatBubble({ me, text }: Props) {
  if (text.startsWith(DOC_PREFIX)) {
    try {
      const payload = JSON.parse(text.slice(DOC_PREFIX.length)) as { url: string; name: string };
      return <DocBubble me={me} url={payload.url} name={payload.name} />;
    } catch {
      // fall through to plain text
    }
  }

  return (
    <View style={[s.bubble, me ? s.me : s.them]}>
      <Text style={[s.text, { color: me ? NM.cream : NM.ink }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  me: {
    alignSelf: 'flex-end',
    backgroundColor: NM.ink,
    borderRadius: 18,
    borderBottomRightRadius: 6,
  },
  them: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: NM.hair,
    ...NM.shadow.soft,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  docBubble: {
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBody: { flex: 1 },
  docName: { fontSize: 13, fontWeight: '600' },
  docTap: { fontSize: 11, marginTop: 1 },
});
