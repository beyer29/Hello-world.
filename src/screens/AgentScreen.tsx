import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAgent, useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ChatMessage } from "@/types";

const QUICK_ACTIONS = [
  "Scan for faults",
  "List modules",
  "Back up my coding",
  "Start live data",
  "Show tuning options",
];

export default function AgentScreen() {
  // Beyer's target screens (ModuleDetail/Flash) live inside the Modules
  // tab's nested stack, so this needs an untyped cross-navigator navigate
  // rather than a screen-local typed navigation prop.
  const navigation = useNavigation<any>();
  const { vehicle } = useVehicle();
  const { messages, sendMessage } = useAgent();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const greeted = useRef(false);

  useEffect(() => {
    if (!greeted.current && messages.length === 0) {
      greeted.current = true;
      sendMessage("hello");
    }
  }, [messages.length, sendMessage]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setInput("");
      setSending(true);
      try {
        const response = await sendMessage(trimmed);
        if (response.navigateTo) {
          navigation.navigate("ModulesTab", {
            screen: response.navigateTo.screen,
            params: { moduleId: response.navigateTo.moduleId },
          });
        }
      } finally {
        setSending(false);
      }
    },
    [sending, sendMessage, navigation]
  );

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Beyer</Text>
          <Text style={styles.subtitle}>
            {vehicle ? `Assistant for ${vehicle.decoded.manufacturer}` : "Assistant"}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => <MessageBubble message={item} />}
        />

        {sending ? (
          <View style={styles.typingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.typingText}>Beyer is thinking...</Text>
          </View>
        ) : null}

        <View style={styles.quickActionsRow}>
          <FlatList
            data={QUICK_ACTIONS}
            horizontal
            keyExtractor={(a) => a}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSend(item)}
                disabled={sending}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipLabel}>{item}</Text>
              </Pressable>
            )}
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Beyer something..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={() => handleSend(input)}
            editable={!sending}
          />
          <Pressable
            onPress={() => handleSend(input)}
            disabled={sending || !input.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              (sending || !input.trim()) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.sendButtonLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messageList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
  },
  bubbleText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bubbleTextUser: {
    color: colors.textPrimary,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quickActionsRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sendButtonLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
