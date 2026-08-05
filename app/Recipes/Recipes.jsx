'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './Recipes.css';

// - Image Imports ----------------
import recHero from './img/rec-hero.jpeg';
import avocadoToast from './img/avacado-toast.jpg';
import chocolateKhakra from './img/chocolate-khakra.jpg';
import chutneyCrunch from './img/chutney-crunch-toast.jpg';
import cucumberRaita from './img/cucumber-raita-stack.jpg';
import curryLeafChat from './img/curry-leaf-chat.jpg';
import grandPartyPlatter from './img/grand-party-platter.jpg';
import kBhel from './img/k-bhel.jpg';
import kCanapes from './img/k-canapes.jpg';
import kPizza from './img/k-pizza.jpg';
import kTomatoSoup from './img/k-tomato-soup.jpg';
import khakhraNachos from './img/khakhra-nachos.jpg';
import masalaKhakhraToast from './img/masala-khakhra-toast.jpg';
import mintChutney from './img/mint-chutney.jpg';
import redPepperHummus from './img/red-pepper-hummus.jpg';
import coconutYogurt from './img/coconut-yogurt.jpg';
import peanutChutney from './img/peanut-chutney.jpg';
import tomatoSalsa from './img/tomato-salsa.jpg';
import Bruschetta from './img/Bruschetta.jpg'
import Sandwich from './img/Sandwich.jpg'

// - Data -------------------
const CATEGORIES = [
  { id: 'pizza',    title: 'Khakhra Pizza',    count: 8,  sub: 'Crispy, healthy pizza bases',   accent: '#E86A2A', image: kPizza },
  { id: 'chaat',    title: 'Khakhra Chaat',    count: 12, sub: 'Street food with a crunch',     accent: '#C4501A', image: curryLeafChat },
  { id: 'sandwich', title: 'Khakhra Sandwich', count: 6,  sub: 'Layered meals, every occasion', accent: '#F4923D', image: masalaKhakhraToast },
  { id: 'soup',     title: 'Soup & Crumbles',  count: 5,  sub: 'Warm bowls with texture',       accent: '#A84010', image: kTomatoSoup },
  { id: 'dessert',  title: 'Khakhra Desserts', count: 4,  sub: 'Sweet innovations',             accent: '#D66020', image: chocolateKhakra },
  { id: 'party',    title: 'Party Platters',   count: 10, sub: 'Celebrate with crunch',         accent: '#E87840', image: grandPartyPlatter },
];

const QUICK_RECIPES = [
  {
    id: 'khakhra-bhel',
    title: 'Khakhra Bhel',
    time: '5 min', difficulty: 'Easy', serves: 2, flavor: 'Curry Leaves',
    image: kBhel,
    ingredients: [
      '4 WIN-DIA Curry Leaves Khakhras (broken)',
      '1/2 cup puffed rice',
      '1 small onion (finely chopped)',
      '1 small tomato (finely chopped)',
      '2 tbsp tamarind chutney',
      '2 tbsp green chutney',
      '1/4 tsp chaat masala',
      'Fresh coriander and sev for garnish',
    ],
    steps: [
      { title: 'Break the Khakhras', desc: 'Break Curry Leaves Khakhras into bite-sized pieces into a large mixing bowl. Add puffed rice and toss lightly.' },
      { title: 'Add Vegetables', desc: 'Add finely chopped onion and tomato. Toss gently so the khakhra pieces stay crunchy.' },
      { title: 'Add Chutneys', desc: 'Drizzle tamarind chutney and green chutney. Sprinkle chaat masala and toss everything together.' },
      { title: 'Garnish & Serve', desc: 'Top with fresh coriander and sev. Serve within 2 minutes for maximum crunch!' },
    ],
  },
  {
    id: 'masala-toast',
    title: 'Masala Khakhra Toast',
    time: '7 min', difficulty: 'Easy', serves: 1, flavor: 'Garlic',
    image: masalaKhakhraToast,
    ingredients: [
      '2 WIN-DIA Garlic Khakhras',
      '2 tbsp butter or vegan spread',
      '1/4 tsp cumin powder',
      '1/4 tsp red chilli powder',
      'Pinch of amchur',
      '1 tbsp finely chopped coriander',
      'Salt to taste',
    ],
    steps: [
      { title: 'Make Masala Butter', desc: 'Mix softened butter with cumin powder, red chilli powder, amchur, coriander and salt until combined.' },
      { title: 'Spread on Khakhra', desc: 'Spread the masala butter generously on each Garlic Khakhra, reaching the edges.' },
      { title: 'Warm It Up', desc: 'Air fry at 150°C for 90 seconds or microwave for 20 seconds until butter melts into the khakhra.' },
      { title: 'Serve', desc: 'Serve hot with a cup of chai. Garnish with extra fresh coriander.' },
    ],
  },
  {
    id: 'chutney-crunch',
    title: 'Chutney Crunch Toast',
    time: '3 min', difficulty: 'Easy', serves: 2, flavor: 'Methi',
    image: chutneyCrunch,
    ingredients: [
      '4 WIN-DIA Methi Khakhras',
      '4 tbsp fresh mint-coriander chutney',
      '1/4 cup finely diced cucumber',
      '2 tbsp pomegranate seeds',
      'Pinch of black salt',
      'Pinch of roasted cumin powder',
    ],
    steps: [
      { title: 'Spread the Chutney', desc: 'Spread 1 tbsp of fresh mint-coriander chutney evenly on each Methi Khakhra.' },
      { title: 'Add Toppings', desc: 'Scatter diced cucumber and pomegranate seeds over the chutney layer.' },
      { title: 'Season', desc: 'Sprinkle black salt and roasted cumin powder for that street-food finish.' },
      { title: 'Serve Immediately', desc: 'Serve right away to keep the khakhra crisp. Great as a tea-time snack.' },
    ],
  },
  {
    id: 'avocado-khakhra',
    title: 'Avocado Smash Khakhra',
    time: '5 min', difficulty: 'Easy', serves: 2, flavor: 'Moringa',
    image: avocadoToast,
    ingredients: [
      '4 WIN-DIA Moringa Khakhras',
      '1 ripe avocado',
      '1 tsp lemon juice',
      '1/4 tsp chilli flakes',
      'Salt and pepper to taste',
      '4 cherry tomatoes (halved)',
      'Microgreens or fresh basil for garnish',
    ],
    steps: [
      { title: 'Smash the Avocado', desc: 'Scoop avocado flesh into a bowl. Add lemon juice, salt and pepper. Smash with a fork — keep it slightly chunky.' },
      { title: 'Spread on Khakhra', desc: 'Spread the smashed avocado generously on each Moringa Khakhra.' },
      { title: 'Add Toppings', desc: 'Place halved cherry tomatoes on top. Sprinkle chilli flakes for heat.' },
      { title: 'Garnish & Serve', desc: 'Top with microgreens or fresh basil. Serve immediately for maximum crunch.' },
    ],
  },
  {
    id: 'khakhra-nachos',
    title: 'Khakhra Nachos Bowl',
    time: '8 min', difficulty: 'Easy', serves: 3, flavor: 'Garlic',
    image: khakhraNachos,
    ingredients: [
      '6 WIN-DIA Garlic Khakhras (broken into chips)',
      '1/2 cup salsa or tomato dip',
      '1/4 cup sour cream or thick yogurt',
      '1/4 cup grated cheese (optional)',
      '2 tbsp pickled jalapeños',
      '1/4 cup black beans (cooked)',
      'Fresh coriander and lime wedges',
    ],
    steps: [
      { title: 'Break and Arrange', desc: 'Break Garlic Khakhras into large chip-sized pieces. Spread in a wide shallow bowl.' },
      { title: 'Layer Toppings', desc: 'Spoon salsa over the chips. Add black beans and pickled jalapeños.' },
      { title: 'Add Cheese', desc: 'Sprinkle grated cheese and microwave for 30 seconds until just melted.' },
      { title: 'Finish and Serve', desc: 'Add dollops of sour cream. Garnish with coriander and serve with lime wedges.' },
    ],
  },
  {
    id: 'cucumber-raita',
    title: 'Cucumber Raita Stack',
    time: '6 min', difficulty: 'Easy', serves: 2, flavor: 'Methi',
    image: cucumberRaita,
    ingredients: [
      '4 WIN-DIA Methi Khakhras',
      '1 cup thick yogurt',
      '1/2 cucumber (grated and squeezed dry)',
      '1/4 tsp roasted cumin powder',
      '1/4 tsp black salt',
      '1 tbsp fresh mint leaves (chopped)',
      'Pinch of red chilli powder for garnish',
    ],
    steps: [
      { title: 'Make the Raita', desc: 'Whisk yogurt until smooth. Add grated cucumber, roasted cumin, black salt and fresh mint. Mix well.' },
      { title: 'Taste and Adjust', desc: 'Adjust salt or cumin if needed. Chill for 2 minutes in the fridge if time allows.' },
      { title: 'Stack on Khakhra', desc: 'Spoon a generous amount of raita onto each Methi Khakhra just before serving.' },
      { title: 'Garnish & Serve', desc: 'Dust with red chilli powder and garnish with a small mint leaf. Serve immediately.' },
    ],
  },
  {
    id: 'curry-chaat',
    title: 'Curry Leaf Chaat',
    time: '8 min', difficulty: 'Easy', serves: 2, flavor: 'Curry Leaves',
    image: curryLeafChat,
    ingredients: [
      '4 WIN-DIA Curry Leaves Khakhras',
      '1/2 cup boiled chickpeas',
      '1 small onion (diced)',
      '1 tomato (diced)',
      '2 tbsp tamarind chutney',
      '1 tbsp green chutney',
      '1/2 tsp chaat masala',
      'Sev and coriander for garnish',
    ],
    steps: [
      { title: 'Prepare the Base', desc: 'Place Curry Leaves Khakhras on a plate. Top with boiled chickpeas, diced onion and tomato.' },
      { title: 'Add Chutneys', desc: 'Drizzle tamarind and green chutney generously over the toppings.' },
      { title: 'Season', desc: 'Sprinkle chaat masala evenly over everything.' },
      { title: 'Garnish & Serve', desc: 'Top with sev and fresh coriander. Serve immediately while khakhra is crisp.' },
    ],
  },
  {
    id: 'canapes',
    title: 'Khakhra Canapés',
    time: '8 min', difficulty: 'Easy', serves: 4, flavor: 'Garlic',
    image: kCanapes,
    ingredients: [
      '4 WIN-DIA Garlic Khakhras (cut into quarters)',
      '100g cream cheese or hung curd',
      '2 tbsp sun-dried tomatoes (chopped)',
      '1 tbsp fresh basil or coriander',
      '6 cherry tomatoes (halved)',
      'Extra virgin olive oil for drizzle',
      'Freshly cracked black pepper',
    ],
    steps: [
      { title: 'Prepare the Spread', desc: 'Whip cream cheese until smooth. Add salt and freshly cracked black pepper.' },
      { title: 'Cut the Khakhras', desc: 'Cut each Garlic Khakhra into quarters using a sharp knife.' },
      { title: 'Spread and Top', desc: 'Spread cream cheese on each piece. Top with cherry tomato and sun-dried tomato.' },
      { title: 'Finish and Plate', desc: 'Drizzle lightly with olive oil. Add basil leaf. Serve within 15 minutes.' },
    ],
  },
];

const WORTH_RECIPES = [
  {
    id: 'garlic-pizza',
    title: 'Garlic Khakhra Pizza',
    time: '18 min', difficulty: 'Medium', serves: 2, flavor: 'Garlic',
    image: kPizza,
    ingredients: [
      '4 WIN-DIA Garlic Khakhras',
      '4 tbsp tomato pizza sauce',
      '1/2 cup mozzarella (grated)',
      '1/4 cup bell peppers (diced)',
      '1/4 cup mushrooms (sliced)',
      '2 tbsp sweet corn',
      '1 tsp dried oregano',
      '1/2 tsp chilli flakes',
      'Fresh basil for garnish',
    ],
    steps: [
      { title: 'Preheat', desc: 'Preheat oven to 180°C or air fryer to 160°C. Place khakhras on a lined baking tray.' },
      { title: 'Add Sauce', desc: 'Spread 1 tbsp of tomato pizza sauce on each khakhra, leaving a small border.' },
      { title: 'Layer Toppings', desc: 'Scatter bell peppers, mushrooms and sweet corn evenly over the sauce.' },
      { title: 'Add Cheese', desc: 'Sprinkle grated mozzarella generously over the toppings.' },
      { title: 'Bake', desc: 'Bake for 8–10 minutes or air fry for 5–6 minutes until cheese melts and edges are golden.' },
      { title: 'Finish and Serve', desc: 'Sprinkle oregano, chilli flakes and fresh basil. Cut in half and serve hot.' },
    ],
  },
  {
    id: 'chocolate-bark',
    title: 'Chocolate Khakhra Bark',
    time: '20 min', difficulty: 'Medium', serves: 4, flavor: 'Plain',
    image: chocolateKhakra,
    ingredients: [
      '4 WIN-DIA Plain Khakhras',
      '200g dark chocolate (70% cocoa)',
      '2 tbsp mixed nuts (almonds, pistachios)',
      '2 tbsp dried cranberries',
      '1 tbsp pumpkin seeds',
      '1/2 tsp sea salt flakes',
      '1 tsp coconut oil',
    ],
    steps: [
      { title: 'Melt the Chocolate', desc: 'Melt dark chocolate with coconut oil in a double boiler or microwave in 30-second bursts, stirring between each.' },
      { title: 'Prepare Base', desc: 'Line a baking tray with parchment paper. Lay Khakhras side by side on the tray.' },
      { title: 'Pour Chocolate', desc: 'Pour melted chocolate evenly over the khakhras, spreading with a spatula to coat completely.' },
      { title: 'Add Toppings', desc: 'Scatter mixed nuts, dried cranberries and pumpkin seeds immediately over wet chocolate.' },
      { title: 'Set and Serve', desc: 'Refrigerate for 15–20 minutes until set. Break into pieces and serve.' },
    ],
  },
  {
    id: 'party-platter',
    title: 'Grand Party Platter',
    time: '25 min', difficulty: 'Medium', serves: 8, flavor: 'Mixed',
    image: grandPartyPlatter,
    ingredients: [
      '4 WIN-DIA Garlic Khakhras',
      '4 WIN-DIA Methi Khakhras',
      '4 WIN-DIA Curry Leaves Khakhras',
      '1 cup mint-coriander chutney',
      '1 cup tamarind chutney',
      '1/2 cup hummus',
      '1 cup assorted crudités',
      '1/4 cup roasted mixed nuts',
      '2 tbsp pomegranate seeds',
      'Fresh herbs for garnish',
    ],
    steps: [
      { title: 'Prepare Dips', desc: 'Set out mint chutney, tamarind chutney and hummus in small serving bowls. Garnish each.' },
      { title: 'Prepare Crudités', desc: 'Cut carrots, cucumber and bell peppers into uniform sticks.' },
      { title: 'Arrange Khakhras', desc: 'Place whole khakhras of each variety in separate sections of a large wooden board.' },
      { title: 'Fill the Gaps', desc: 'Fill gaps with roasted nuts, pomegranate seeds and fresh herb sprigs.' },
      { title: 'Final Touches', desc: 'Place dip bowls at the centre. Add small labels if serving at a formal gathering.' },
    ],
  },
  {
    id: 'tomato-crunch',
    title: 'Tomato Soup Crunch Bowl',
    time: '20 min', difficulty: 'Medium', serves: 2, flavor: 'Methi',
    image: kTomatoSoup,
    ingredients: [
      '4 WIN-DIA Methi Khakhras (broken into croutons)',
      '4 large ripe tomatoes (roughly chopped)',
      '1 small onion (chopped)',
      '3 garlic cloves',
      '1 tbsp olive oil',
      '1/2 cup vegetable stock',
      '2 tbsp fresh cream',
      'Salt, pepper and fresh basil',
    ],
    steps: [
      { title: 'Sauté the Base', desc: 'Heat olive oil. Add onion and garlic. Sauté for 3–4 minutes until soft and golden.' },
      { title: 'Cook Tomatoes', desc: 'Add chopped tomatoes, salt and pepper. Cook on medium heat for 8–10 minutes until broken down.' },
      { title: 'Blend the Soup', desc: 'Blend until completely smooth. Return to pan and add vegetable stock. Simmer for 2 minutes.' },
      { title: 'Serve with Croutons', desc: 'Pour into bowls. Drizzle cream. Float broken Methi Khakhra pieces on top as croutons. Garnish with basil.' },
    ],
  },
{
    id: 'khakhra-nachos-loaded',
    title: 'Loaded Khakhra Nachos',
    time: '15 min', difficulty: 'Medium', serves: 4, flavor: 'Garlic',
    image: khakhraNachos,
    ingredients: [
      '8 WIN-DIA Garlic Khakhras (broken into chips)',
      '1/2 cup tomato salsa',
      '1/2 cup black beans (cooked)',
      '1/2 cup grated mozzarella or cheddar',
      '1/4 cup pickled jalapeños',
      '1/4 cup sour cream or thick yogurt',
      '1 avocado (mashed)',
      '1 tsp chilli powder',
      'Fresh coriander and lime wedges',
    ],
    steps: [
      { title: 'Preheat', desc: 'Preheat oven to 180°C or air fryer to 160°C. Line a baking tray with parchment paper.' },
      { title: 'Layer the Base', desc: 'Spread broken Garlic Khakhra chips in a single layer on the tray. Overlapping slightly is fine.' },
      { title: 'Add Toppings', desc: 'Spoon salsa and black beans evenly over the chips. Sprinkle chilli powder.' },
      { title: 'Add Cheese', desc: 'Cover generously with grated mozzarella or cheddar.' },
      { title: 'Bake', desc: 'Bake for 8–10 minutes or air fry for 5–6 minutes until cheese is melted and bubbly.' },
      { title: 'Finish and Serve', desc: 'Top with mashed avocado, sour cream, jalapeños and fresh coriander. Serve immediately with lime wedges.' },
    ],
  },
  {
    id: 'bruschetta',
    title: 'Khakhra Bruschetta',
    time: '15 min', difficulty: 'Medium', serves: 3, flavor: 'Garlic',
    image: Bruschetta,
    ingredients: [
      '4 WIN-DIA Garlic Khakhras',
      '3 ripe tomatoes (finely diced)',
      '1/4 cup fresh basil (chopped)',
      '2 garlic cloves (minced)',
      '2 tbsp extra virgin olive oil',
      '1 tbsp balsamic vinegar',
      'Salt and black pepper to taste',
      'Parmesan shavings (optional)',
    ],
    steps: [
      { title: 'Make the Topping', desc: 'Combine diced tomatoes, fresh basil, minced garlic, olive oil and balsamic vinegar. Season generously.' },
      { title: 'Rest the Mixture', desc: 'Let the tomato mixture sit for 5–10 minutes so flavours meld together.' },
      { title: 'Spoon on Khakhra', desc: 'Spoon the tomato mixture generously onto each Garlic Khakhra just before serving.' },
      { title: 'Finish and Serve', desc: 'Add parmesan shavings if using. Serve immediately while khakhra stays crisp.' },
    ],
  },
  {
    id: 'pesto-pizza',
    title: 'Pesto Veggie Pizza',
    time: '18 min', difficulty: 'Medium', serves: 2, flavor: 'Moringa',
    image: kPizza,
    ingredients: [
      '4 WIN-DIA Moringa Khakhras',
      '4 tbsp basil pesto',
      '1/2 cup cherry tomatoes (halved)',
      '1/4 cup baby spinach',
      '1/4 cup mozzarella or feta (crumbled)',
      '2 tbsp pine nuts',
      'Fresh basil and olive oil to finish',
    ],
    steps: [
      { title: 'Preheat', desc: 'Preheat oven to 180°C or air fryer to 160°C.' },
      { title: 'Spread Pesto', desc: 'Spread 1 tbsp basil pesto on each Moringa Khakhra all the way to the edges.' },
      { title: 'Add Toppings', desc: 'Top with cherry tomatoes, baby spinach and crumbled mozzarella or feta.' },
      { title: 'Bake', desc: 'Bake for 7–8 minutes until cheese softens and edges are lightly golden.' },
      { title: 'Finish and Serve', desc: 'Scatter pine nuts and fresh basil. Drizzle with olive oil and serve hot.' },
    ],
  },
  {
    id: 'moringa-sandwich',
    title: 'Moringa Layered Sandwich',
    time: '15 min', difficulty: 'Medium', serves: 2, flavor: 'Moringa',
    image: Sandwich,
    ingredients: [
      '4 WIN-DIA Moringa Khakhras',
      '1/2 cup hung curd or cream cheese',
      '1/4 cup roasted red peppers (sliced)',
      '1/4 cup cucumber (thinly sliced)',
      '1/4 avocado (sliced)',
      '1 tbsp lemon juice',
      'Salt, pepper and microgreens',
    ],
    steps: [
      { title: 'Prepare the Spread', desc: 'Mix hung curd with lemon juice, salt and pepper until smooth and spreadable.' },
      { title: 'Spread the Base', desc: 'Spread the hung curd mixture on 2 khakhras generously.' },
      { title: 'Layer the Fillings', desc: 'Layer roasted red peppers, cucumber slices and avocado on top of the spread.' },
      { title: 'Top and Serve', desc: 'Place the second khakhra on top. Press gently. Add microgreens on the side and serve.' },
    ],
  },
];

const MEAL_PREP = [
  { title: 'Office Lunch Box',  detail: '2 Khakhras + dip cup + fresh fruit = a perfectly balanced mid-day meal.', cal: 400, badge: 'Balanced',    badgeType: 'green' },
  { title: 'Kids Tiffin Box',   detail: 'Mini khakhra sandwiches + cheese cubes + grapes = kid-approved and nutritious.', cal: 320, badge: 'Light',       badgeType: 'orange' },
  { title: 'Travel Snack Pack', detail: '4 khakhras in airtight container + trail mix = stays fresh, no refrigeration needed.', cal: 450, badge: 'On The Go',  badgeType: 'gold' },
  { title: 'Post-Workout Box',  detail: 'Khakhra + protein spread + banana = high protein recovery within 30 minutes.', cal: 380, badge: 'High Protein', badgeType: 'green' },
];


const DIP_RECIPES = [
  { title: 'Mint-Coriander Chutney', time: '10 min', difficulty: 'Easy', pairing: 'All khakhra flavors', bg: '#C8E6C9', textCol: '#2E5E31', flavor: 'Fresh, zesty & cooling',
    ingredients: ['Fresh mint','Coriander','Green chilli','Lemon','Garlic','Rock salt'], image: mintChutney,
    steps: ['Wash mint and coriander thoroughly.','Blend with green chilli, garlic and lemon juice.','Add rock salt and blend until smooth.','Adjust consistency with a splash of water.','Serve fresh with any khakhra.'] },
  { title: 'Roasted Red Pepper Hummus', time: '15 min', difficulty: 'Medium', pairing: 'Garlic or Plain Khakhra', bg: '#FFCCBC', textCol: '#7A3010', flavor: 'Smoky, creamy & bold',
    ingredients: ['Red pepper','Chickpeas','Tahini','Olive oil','Cumin','Garlic'], image: redPepperHummus,
    steps: ['Roast red pepper directly over flame until charred.','Peel and deseed the roasted pepper.','Blend chickpeas, tahini, garlic and olive oil until smooth.','Add roasted pepper and cumin, blend again.','Drizzle with olive oil before serving.'] },  { title: 'Coconut Yogurt Dip', time: '5 min', difficulty: 'Easy', pairing: 'Curry Leaves Khakhra', bg: '#FFF9C4', textCol: '#7A6000', flavor: 'Tropical, light & creamy',
    ingredients: ['Coconut milk','Yogurt','Curry leaves','Mustard seeds','Salt','Lime'], image: coconutYogurt,
    steps: ['Whisk yogurt and coconut milk together until smooth.','Heat oil, splutter mustard seeds and curry leaves.','Pour tempering over the yogurt mixture.','Add lime juice and salt, mix gently.','Chill for 10 minutes before serving.'] },

  { title: 'Peanut-Coconut Chutney', time: '12 min', difficulty: 'Easy', pairing: 'All flavors', bg: '#D7CCC8', textCol: '#4A2E22', flavor: 'Nutty, hearty & earthy',
    ingredients: ['Roasted peanuts','Coconut','Tamarind','Red chilli','Curry leaves','Oil'], image: peanutChutney,
    steps: ['Dry roast peanuts until golden, let cool.','Blend peanuts, coconut, tamarind and red chilli with water.','Heat oil and temper with curry leaves.','Pour tempering into chutney and mix.','Serve at room temperature.'] },

  { title: 'Spicy Tomato Salsa', time: '10 min', difficulty: 'Easy', pairing: 'Garlic Khakhra', bg: '#FFCDD2', textCol: '#7A1C1C', flavor: 'Tangy, fiery & fresh',
    ingredients: ['Tomatoes','Onion','Jalapeno','Coriander','Lime juice','Cumin'], image: tomatoSalsa,
    steps: ['Finely dice tomatoes, onion and jalapeno.','Roughly chop fresh coriander.','Combine all in a bowl with lime juice.','Season with cumin and salt.','Let sit 5 minutes for flavors to meld.'] },
];

const DIFF_COLORS = { Easy: '#2E7D4F', Medium: '#C4501A', Advanced: '#8B2010' };

// - Hooks ------------------
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [threshold]);
  return [ref, inView];
}

function AnimatedCard({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`win-rc-animated-card ${inView ? 'win-rc-animated-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// - Expandable Recipe Card -------------
function RecipeCard({ recipe, isOpen, onToggle, delay = 0 }) {
  const [checked, setChecked] = useState([]);
  const toggleCheck = (item) =>
    setChecked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  return (
    <AnimatedCard delay={delay} className={`win-rc-rcard ${isOpen ? 'win-rc-rcard--open' : ''}`}>
      {/* Collapsed view */}
      <div className="win-rc-rcard-thumb" onClick={onToggle}>
        <img src={recipe.image.src} alt={recipe.title} className="win-rc-rcard-img" loading="lazy" />
        <div className="win-rc-rcard-overlay" />
        <div className="win-rc-rcard-info">
          <span className="win-rc-rcard-flavor">{recipe.flavor}</span>
          <h3 className="win-rc-rcard-title">{recipe.title}</h3>
          <div className="win-rc-rcard-meta">
            <span className="win-rc-rcard-time">⏱ {recipe.time}</span>
            <span className="win-rc-rcard-diff" style={{ color: DIFF_COLORS[recipe.difficulty] }}>
              {recipe.difficulty}
            </span>
            <span className="win-rc-rcard-serves">Serves {recipe.serves}</span>
          </div>
        </div>
        <button className="win-rc-rcard-toggle" type="button">
          {isOpen ? '✕' : '+ View Recipe'}
        </button>
      </div>

      {/* Expanded view */}
      {isOpen && (
        <div className="win-rc-rcard-expanded">
          <div className="win-rc-rcard-exp-img">
            <img src={recipe.image.src} alt={recipe.title} loading="lazy" />
          </div>
          <div className="win-rc-rcard-exp-content">
            {/* Ingredients */}
            <div className="win-rc-rcard-exp-section">
              <h4 className="win-rc-rcard-exp-heading">Ingredients</h4>
              <ul className="win-rc-ingredient-list">
                {recipe.ingredients.map((item) => (
                  <li
                    key={item}
                    className={`win-rc-ingredient-item ${checked.includes(item) ? 'win-rc-ingredient-checked' : ''}`}
                    onClick={() => toggleCheck(item)}
                  >
                    <span className="win-rc-ingredient-check">
                      {checked.includes(item) ? '✓' : '○'}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Steps */}
            <div className="win-rc-rcard-exp-section">
              <h4 className="win-rc-rcard-exp-heading">Steps</h4>
              <div className="win-rc-steps-list">
                {recipe.steps.map((step, i) => (
                  <div key={step.title} className="win-rc-step">
                    <div className="win-rc-step-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="win-rc-step-body">
                      <div className="win-rc-step-title">{step.title}</div>
                      <p className="win-rc-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatedCard>
  );
}

// - Category Card ----------------
function CategoryCard({ cat, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <AnimatedCard delay={delay} className="win-rc-cat-card">
      <div
        className={`win-rc-cat-card-link ${hovered ? 'win-rc-cat-hovered' : ''}`}
        style={{ '--win-cat-accent': cat.accent }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="win-rc-cat-accent-bar" />
        <div className="win-rc-cat-image">
          <img src={cat.image.src} alt={cat.title} className="win-rc-cat-img" loading="lazy" />
        </div>
        <div className="win-rc-cat-body">
          <div className="win-rc-cat-count">{cat.count} recipes</div>
          <h3 className="win-rc-cat-title">{cat.title}</h3>
          <p className="win-rc-cat-sub">{cat.sub}</p>
        </div>
      </div>
    </AnimatedCard>
  );
}

// - Dip Card -----------------
// Replace your existing DipCard component with this:
function DipCard({ dip, index = 0, delay = 0 }) {
  const [checked, setChecked] = useState([]);
  const toggleCheck = (item) =>
    setChecked(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );

  return (
    <AnimatedCard delay={delay} className="win-rc-dip-card">
      <div className="win-rc-dip-inner">

        {/* Left: Image + badge */}
        <div className="win-rc-dip-img-col">
          <img
            src={dip.image?.src || dip.image}
            alt={dip.title}
            className="win-rc-dip-img"
            loading="lazy"
          />
          <div className="win-rc-dip-img-meta">
            <span className="win-rc-dip-num">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="win-rc-dip-diff-pill"
              style={{ color: DIFF_COLORS[dip.difficulty] }}
            >
              {dip.difficulty}
            </span>
          </div>
        </div>

        {/* Right: Content */}
        <div className="win-rc-dip-content">
          <div className="win-rc-dip-content-header">
            <div>
              <p className="win-rc-dip-flavor-tag">{dip.flavor}</p>
              <h4 className="win-rc-dip-title">{dip.title}</h4>
              <p className="win-rc-dip-pairing">Pairs with: {dip.pairing}</p>
            </div>
            <span className="win-rc-dip-time-chip">⏱ {dip.time}</span>
          </div>

          {/* Ingredients */}
          <p className="win-rc-dip-label">Ingredients</p>
          <ul className="win-rc-dip-ingredients-list">
            {dip.ingredients.map(item => (
              <li
                key={item}
                className={`win-rc-dip-ing-item ${
                  checked.includes(item) ? 'win-rc-dip-ing-checked' : ''
                }`}
                onClick={() => toggleCheck(item)}
              >
                <span className="win-rc-dip-ing-dot">
                  {checked.includes(item) ? '✓' : ''}
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Steps */}
          <p className="win-rc-dip-label" style={{ marginTop: '14px' }}>Steps</p>
          <ol className="win-rc-dip-steps-list">
            {dip.steps.map((step, i) => (
              <li key={i} className="win-rc-dip-step-item">
                <span className="win-rc-dip-step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </AnimatedCard>
  );
}
// - Hero -------------------
function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <section className="win-rc-hero">
      <div
        className="win-rc-hero-bg"
        style={{
          backgroundImage: `url(${recHero.src})`,
          transform: `translateY(${scrollY * 0.2}px)`
        }}
      />
      <div className="win-rc-hero-overlay" />
      <div className="win-rc-hero-content">
        <div className="win-rc-hero-eyebrow">
          <span className="win-rc-eyebrow-bar" />
          <span>WIN-DIA Kitchen</span>
          <span className="win-rc-eyebrow-bar" />
        </div>
        <h1 className="win-rc-hero-h1">
          Beyond Snacking<br />
          <em>with WIN-DIA</em>
        </h1>
        <p className="win-rc-hero-desc">
          Transform your favourite khakhra into pizzas, chaats, sandwiches, desserts and more.
          Every recipe is tested, healthy and delicious.
        </p>
      </div>
    </section>
  );
}

// - Categories -----------------

// - Quick & Easy ----------------─
function QuickSection() {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  return (
    <section className="win-rc-section win-rc-quick-section">
      <div className="win-rc-container">
        <div className="win-rc-section-hdr">
          <div className="win-rc-overline">Under 10 Minutes</div>
          <h2 className="win-rc-h2">Quick &amp; Easy Recipes</h2>
          <p className="win-rc-section-sub">Perfect for busy days when you need something fast and nourishing.</p>
        </div>
        <div className="win-rc-recipes-grid">
          {QUICK_RECIPES.map((r, i) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              isOpen={openId === r.id}
              onToggle={() => toggle(r.id)}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// - Worth The Wait ---------------──
function WorthSection() {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  return (
    <section className="win-rc-section win-rc-worth-section">
      <div className="win-rc-container">
        <div className="win-rc-section-hdr">
          <div className="win-rc-overline">Worth Every Minute</div>
          <h2 className="win-rc-h2">Worth The Wait</h2>
          <p className="win-rc-section-sub">A little more time, a lot more flavour. These recipes reward every extra minute you give them.</p>
        </div>
        <div className="win-rc-recipes-grid">
          {WORTH_RECIPES.map((r, i) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              isOpen={openId === r.id}
              onToggle={() => toggle(r.id)}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// - Meal Prep -----------------─
// ─── Meal Prep Ticker ─────────────────────────────────────────────
const MEAL_PREP_ITEMS = [
  { kcal: 400, name: 'Office Lunch Box',   desc: '2 Khakhras + dip cup + fresh fruit — a perfectly balanced mid-day meal.',        tag: 'Balanced',     accent: 'var(--color-green)',  tint: 'var(--green-pale)' },
  { kcal: 320, name: 'Kids Tiffin Box',    desc: 'Mini khakhra sandwiches + cheese cubes + grapes — kid-approved and nutritious.', tag: 'Light',        accent: 'var(--color-orange)', tint: 'var(--orange-pale)' },
  { kcal: 450, name: 'Travel Snack Pack',  desc: '4 khakhras in airtight container + trail mix — stays fresh, no fridge needed.',  tag: 'On The Go',    accent: 'var(--color-gold)',   tint: 'var(--cream-dk)' },
  { kcal: 380, name: 'Post-Workout Box',   desc: 'Khakhra + protein spread + banana — high protein recovery within 30 minutes.',   tag: 'High Protein', accent: 'var(--sage)',         tint: 'var(--green-pale)' },
];

const MEAL_MAX_KCAL = 600;
const MEAL_RING_R = 30;
const MEAL_CIRC = 2 * Math.PI * MEAL_RING_R;

function MealPrepTicker() {
  const [index, setIndex] = useState(0);
  const [ringOffset, setRingOffset] = useState(MEAL_CIRC);
  const timerRef = useRef(null);

  useEffect(() => {
    const pct = MEAL_PREP_ITEMS[index].kcal / MEAL_MAX_KCAL;
    setRingOffset(MEAL_CIRC);
    const fillTimeout = setTimeout(() => {
      setRingOffset(MEAL_CIRC - MEAL_CIRC * pct);
    }, 350);
    return () => clearTimeout(fillTimeout);
  }, [index]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % MEAL_PREP_ITEMS.length);
    }, 2800);
    return () => clearInterval(timerRef.current);
  }, []);

  const item = MEAL_PREP_ITEMS[index];

  return (
    <section className="win-mp-section">
      <div className="win-mp-container">
        <span className="win-hb-section-overline">MEAL PREP IDEAS</span>
        <h2 className="win-hb-section-title">WIN-DIA In Your Weekly Plan</h2>
        <p className="win-mp-sub">Ready in minutes, every single time</p>

        <div className="win-mp-frame" style={{ background: item.tint }}>
          <div className="win-mp-slide">
            <div className="win-mp-ring-wrap">
              <svg width="80" height="80" viewBox="0 0 80 80" className="win-mp-ring-svg">
                <circle cx="40" cy="40" r={MEAL_RING_R} className="win-mp-ring-track" />
                <circle
                  cx="40"
                  cy="40"
                  r={MEAL_RING_R}
                  className="win-mp-ring-fill"
                  style={{
                    stroke: item.accent,
                    strokeDasharray: MEAL_CIRC,
                    strokeDashoffset: ringOffset,
                  }}
                />
              </svg>
              <div className="win-mp-ring-label">
                <span className="win-mp-ring-num">{item.kcal}</span>
                <span className="win-mp-ring-unit">kcal</span>
              </div>
            </div>

            <div className="win-mp-text">
              <span className="win-mp-tag" style={{ color: item.accent }}>{item.tag}</span>
              <div className="win-mp-name">{item.name}</div>
              <p className="win-mp-desc">{item.desc}</p>
            </div>
          </div>
        </div>

        <div className="win-mp-dots">
          {MEAL_PREP_ITEMS.map((_, i) => (
            <button
              key={i}
              className={`win-mp-dot ${i === index ? 'win-mp-dot--active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show ${MEAL_PREP_ITEMS[i].name}`}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// - Dips -------------------
// Replace your existing DipsSection with this:
function DipsSection() {
  return (
    <section className="win-rc-section win-rc-dips-section">
      <div className="win-rc-container">
        <div className="win-rc-section-hdr">
          <div className="win-rc-overline">Perfect Pairings</div>
          <h2 className="win-rc-h2">Homemade Dips and Spreads</h2>
          <p className="win-rc-section-sub">
            Every dip recipe crafted to elevate your khakhra experience.
          </p>
        </div>
      </div>

      {/* Full-bleed scroll track — no container constraint */}
      <div className="win-rc-dips-scroll-outer">
        <div className="win-rc-dips-scroll-track">
          {DIP_RECIPES.map((d, i) => (
            <DipCard key={d.title} dip={d} index={i} delay={i * 80} />
          ))}
        </div>
        <p className="win-rc-dips-scroll-hint">
          <span className="win-rc-eyebrow-bar" /> Scroll to explore more dips
        </p>
      </div>
    </section>
  );
}
// - Main -------------------
const Recipes = () => (
  <div className="win-rc-page">
    <HeroSection />
    <QuickSection />
    <WorthSection />
    <MealPrepTicker />
    <DipsSection />
  </div>
);

export default Recipes;
