import { Image, type ImageProps } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PassengerTrip } from "@/lib/auth";
import type { PublicTrip, RoutePreview } from "@/lib/api";
import { Design } from "@/constants/design";
import { homeStyles as styles } from "@/constants/home-styles";
import { AppIcon } from "./app-icon";
import { BrandMark } from "./brand-mark";
import { journeyImage } from "./journey-hero";

type Destination = "/notifications" | "/profile" | "/auth" | "/trips" | "/messages" | "/explore";
type ContentState = "loading" | "error" | "empty" | "ready";

export function PassengerHome({ signedIn, authLoading, name, departureCity, avatarSource, nextTrip, tripState, rides, rideState, routePreviews, onSearch, onOpenRide, onOpenBooking, onNavigate, onRetryRides }: {
  signedIn: boolean;
  authLoading: boolean;
  name: string;
  departureCity: string;
  avatarSource: ImageProps["source"];
  nextTrip: PassengerTrip | null;
  tripState: ContentState;
  rides: PublicTrip[];
  rideState: ContentState;
  routePreviews: Record<string, RoutePreview>;
  onSearch: (to?: string, from?: string) => void;
  onOpenRide: (id: string) => void;
  onOpenBooking: (booking: PassengerTrip) => void;
  onNavigate: (destination: Destination) => void;
  onRetryRides: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <BrandMark />
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={() => onNavigate("/notifications")} style={styles.notification}><AppIcon name="bell" color={Design.color.navy} size={21} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => onNavigate("/profile")} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            {authLoading ? <ActivityIndicator color={Design.color.primary} size="small" /> : avatarSource ? <Image source={avatarSource} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarText}>{signedIn ? initials(name) : "V"}</Text>}
          </Pressable>
        </View>
      </View>
      <Text style={styles.greeting}>{signedIn ? `Good to see you, ${name.trim().split(/\s+/)[0]}.` : "A little company. A lot more possibility."}</Text>
      <Text style={styles.homeTitle}>Where to next?</Text>
      <Text style={styles.homeSubtitle}>Find a seat. Make the journey yours.</Text>

      <View style={styles.searchCard}>
        <View style={styles.routeFields}>
          <View style={styles.fieldRail}><View style={styles.originDot} /><View style={styles.fieldConnector} /><View style={styles.destinationDot} /></View>
          <View style={styles.fieldContent}>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose departure city" onPress={() => onSearch()} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldLabel}>FROM</Text><Text style={[styles.fieldValue, !departureCity && styles.placeholder]} numberOfLines={1}>{departureCity || "Departure city"}</Text>
            </Pressable>
            <View style={styles.fieldDivider} />
            <Pressable accessibilityRole="button" accessibilityLabel="Choose destination" onPress={() => onSearch()} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldLabel}>TO</Text><Text style={[styles.fieldValue, styles.placeholder]}>Where are you going?</Text>
            </Pressable>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose travel date and seats" onPress={() => onSearch()} style={styles.searchOptions}>
          <View style={styles.searchOption}><AppIcon name="clock" size={16} /><Text style={styles.searchOptionText}>Any date</Text></View>
          <View style={styles.optionDivider} />
          <View style={styles.searchOption}><AppIcon name="ticket" size={17} /><Text style={styles.searchOptionText}>1 seat</Text></View>
          <Text style={styles.changeOptions}>Change</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onSearch()} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}><View style={styles.searchButtonLabel}><AppIcon name="search" color="#FFFFFF" size={20} /><Text style={styles.searchButtonText}>Find a ride</Text></View><AppIcon name="arrow" color="#FFFFFF" size={21} /></Pressable>
      </View>

      <View style={styles.quickActions}>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("/trips")} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><AppIcon name="ticket" size={20} /><Text style={styles.quickActionText}>My trips</Text><AppIcon name="onward" size={15} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("/messages")} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><AppIcon name="messages" size={20} /><Text style={styles.quickActionText}>Messages</Text><AppIcon name="onward" size={15} /></Pressable>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your next journey</Text>{signedIn ? <Pressable accessibilityRole="button" onPress={() => onNavigate("/trips")} style={styles.sectionLink}><Text style={styles.linkText}>View all</Text></Pressable> : null}</View>
      {!signedIn ? (
        <Pressable accessibilityRole="button" onPress={() => onNavigate("/auth")} style={({ pressed }) => [styles.accountCard, pressed && styles.pressed]}>
          <View style={styles.accountIcon}><AppIcon name="ticket" size={24} /></View>
          <View style={styles.accountCopy}><Text style={styles.accountTitle}>Your trip, all in one place.</Text><Text style={styles.accountText}>Sign in for bookings and travel updates.</Text><Text style={styles.accountLink}>Sign in</Text></View><AppIcon name="arrow" size={20} />
        </Pressable>
      ) : tripState === "loading" ? (
        <View style={styles.stateCard}><ActivityIndicator color={Design.color.primary} /><Text style={styles.stateText}>Loading your trips…</Text></View>
      ) : nextTrip ? (
        <PassengerJourneyCard trip={nextTrip} onPress={() => onOpenBooking(nextTrip)} />
      ) : (
        <View style={styles.emptyCard}><View style={styles.emptyIcon}><AppIcon name="ticket" size={23} /></View><Text style={styles.emptyTitle}>{tripState === "error" ? "Unable to load your trips" : "A new journey awaits."}</Text><Text style={styles.emptyText}>{tripState === "error" ? "Open your trips to try again." : "Find your next ride above. Your booking and trip updates will appear here."}</Text>{tripState === "error" ? <Pressable accessibilityRole="button" onPress={() => onNavigate("/trips")} style={styles.emptyAction}><Text style={styles.linkText}>Open my trips</Text><AppIcon name="arrow" size={18} /></Pressable> : null}</View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.accountCopy}><Text style={styles.sectionTitle}>Ready to go</Text><Text style={styles.sectionDescription}>{departureCity ? `Departures from ${departureCity} and beyond` : "Upcoming rides you can book"}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => onSearch()} style={styles.sectionLink}><Text style={styles.linkText}>See all</Text></Pressable>
      </View>
      {rideState === "loading" ? (
        <View style={styles.stateCard}><ActivityIndicator color={Design.color.primary} /><Text style={styles.stateText}>Finding available rides…</Text></View>
      ) : rides.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rideList}>
          {rides.slice(0, 3).map((trip) => (
            <Pressable key={trip.id} accessibilityRole="button" accessibilityLabel={`${trip.from} to ${trip.to}, ${trip.fare} per seat`} onPress={() => onOpenRide(trip.id)} style={({ pressed }) => [styles.rideCard, pressed && styles.pressed]}>
              <View style={styles.rideTop}><Text style={styles.departure}>{formatTripDate(trip.departureAt)}</Text><Text style={styles.seatBadge}>{trip.availableSeats} {trip.availableSeats === 1 ? "seat" : "seats"} left</Text></View>
              <View style={styles.rideMain}><View style={styles.cityRail}><View style={styles.smallOrigin} /><View style={styles.cityConnector} /><View style={styles.smallDestination} /></View><View style={styles.cities}><Text style={styles.city}>{trip.from}</Text><Text style={styles.city}>{trip.to}</Text></View></View>
              <View style={styles.rideBottom}><View style={styles.accountCopy}><Text style={styles.fare}>{trip.fare}<Text style={styles.perSeat}> / seat</Text></Text><Text style={styles.rideDetail}>{trip.driver?.name || "View driver details"}{routePreviews[trip.id] ? ` · ${Math.round(routePreviews[trip.id].distanceKm)} km` : ""}</Text></View><View style={styles.rideAction}><AppIcon name="arrow" size={20} /></View></View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}><View style={styles.emptyIcon}><AppIcon name={rideState === "error" ? "road" : "search"} size={23} /></View><Text style={styles.emptyTitle}>{rideState === "error" ? "Unable to load rides" : "No rides available yet"}</Text><Text style={styles.emptyText}>{rideState === "error" ? "Check your connection and try again." : "Try another destination or check back for new departures."}</Text><Pressable accessibilityRole="button" onPress={rideState === "error" ? onRetryRides : () => onSearch()} style={styles.emptyAction}><Text style={styles.linkText}>{rideState === "error" ? "Try again" : "Search rides"}</Text><AppIcon name="arrow" size={18} /></Pressable></View>
      )}

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>A change of scenery</Text><Text style={styles.sectionDescription}>Start with a route. See where it takes you.</Text></View></View>
      <View style={styles.discoveryHero}><Image source={journeyImage} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" /><View style={styles.destinationShade} /><Text style={styles.destinationEyebrow}>GO TOGETHER</Text><Text style={styles.discoveryTitle}>{"Good company.\nNew places."}</Text></View>
      <View style={styles.destinations}>
        {[{ from: "Johannesburg", to: "Durban" }, { from: "Cape Town", to: "George" }].map((destination) => <Pressable key={destination.to} accessibilityRole="button" accessibilityLabel={`Search ${destination.from} to ${destination.to}`} onPress={() => onSearch(destination.to, destination.from)} style={({ pressed }) => [styles.destinationCard, pressed && styles.pressed]}><AppIcon name="pin" size={19} /><View style={styles.accountCopy}><Text style={styles.destinationTitle}>{destination.to}</Text><Text style={styles.destinationRoute}>From {destination.from}</Text></View><AppIcon name="onward" size={17} /></Pressable>)}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onNavigate("/explore")} style={({ pressed }) => [styles.offerCard, pressed && styles.pressed]}><View style={styles.offerMark}><AppIcon name="car" color="#FFFFFF" size={24} /></View><View style={styles.accountCopy}><Text style={styles.offerTitle}>Going your way?</Text><Text style={styles.offerDescription}>Offer a ride and share your travel costs.</Text></View><AppIcon name="onward" color="#FFFFFF" size={22} /></Pressable>
    </ScrollView>
  );
}

export function PassengerJourneyCard({ trip, onPress }: { trip: PassengerTrip; onPress: () => void }) {
  const paid = trip.paymentStatus === "Paid";
  return <View style={styles.bookingCard}>
    <View style={styles.rideTop}><View style={styles.bookingEyebrow}><AppIcon name="ticket" color="#9FC3FF" size={17} /><Text style={styles.bookingLabel}>YOUR TICKET</Text></View><Text style={styles.bookingStatus}>{trip.tripStatus}</Text></View>
    <Text style={styles.bookingRoute}>{trip.route}</Text>
    <View style={styles.bookingDateRow}><AppIcon name="clock" color="#AFCBFA" size={16} /><Text style={styles.bookingDate}>{formatTripDate(trip.departureAt)}</Text></View>
    <View style={styles.bookingBottom}>
      <View style={styles.driverAvatar}><Text style={styles.driverInitials}>{initials(trip.driver)}</Text></View>
      <View style={styles.accountCopy}><Text style={styles.driverName}>{trip.driver}</Text><Text style={styles.bookingMeta}>{trip.seats} {trip.seats === 1 ? "seat" : "seats"} · {trip.paymentStatus}</Text></View>
      <View style={styles.bookingAmount}><Text style={styles.bookingTotal}>{trip.amount}</Text><Text style={styles.bookingMeta}>Total</Text></View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${paid ? "Follow your trip" : "Continue payment"}: ${trip.route}`} onPress={onPress} style={({ pressed }) => [styles.bookingAction, pressed && styles.pressed]}><Text style={styles.bookingActionText}>{paid ? "Follow your trip" : "Continue payment"}</Text><AppIcon name="arrow" color="#FFFFFF" size={20} /></Pressable>
  </View>;
}

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
function formatTripDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
