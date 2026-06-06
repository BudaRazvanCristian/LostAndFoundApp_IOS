import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import { colors } from "../constants/colors";

export interface SectionTitleProps extends TextProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, style, ...rest }) => {
  return (
    <Text style={[styles.title, style]} {...rest}>
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
});

export default SectionTitle;

